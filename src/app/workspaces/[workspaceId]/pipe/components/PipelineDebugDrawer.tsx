'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Drawer, Space, Spin, Tag, Typography } from 'antd';
import { CaretRightOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  PipelineService,
  PipelineDebugStepPlan,
  PipelineDebugStepResult,
} from '@/services/pipe.service';
import RunPayloadJsonBlock from './RunPayloadJsonBlock';
import { RUN_STATUS_FAILED, RUN_STATUS_SUCCESS, statusTag } from './runDetailUtils';
import styles from '../pipeline-editor.module.css';

const { Text, Title } = Typography;

export type PipelineDebugDrawerProps = {
  open: boolean;
  pipelineUuid: string | null;
  onClose: () => void;
};

type DebugState = {
  stepIndex: number;
  currentPayload: unknown;
  priorRunSucceeded: boolean;
  totalSteps: number | null;
  stepLogs: PipelineDebugStepResult[];
  atEnd: boolean;
};

const INITIAL_DEBUG_STATE: DebugState = {
  stepIndex: 0,
  currentPayload: null,
  priorRunSucceeded: true,
  totalSteps: null,
  stepLogs: [],
  atEnd: false,
};

const DEBUG_DRAWER_HEIGHT_KEY = 'elt.pipelineDebugDrawerHeight';
const DEFAULT_HEIGHT_RATIO = 0.42;
const MIN_DRAWER_HEIGHT_PX = 160;
const MAX_DRAWER_HEIGHT_RATIO = 0.88;

function clampDrawerHeight(height: number): number {
  if (typeof window === 'undefined') return height;
  const maxHeight = Math.floor(window.innerHeight * MAX_DRAWER_HEIGHT_RATIO);
  return Math.min(maxHeight, Math.max(MIN_DRAWER_HEIGHT_PX, height));
}

function readStoredDrawerHeight(): number {
  if (typeof window === 'undefined') return 320;
  const stored = sessionStorage.getItem(DEBUG_DRAWER_HEIGHT_KEY);
  const parsed = stored ? Number(stored) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return clampDrawerHeight(parsed);
  }
  return clampDrawerHeight(Math.floor(window.innerHeight * DEFAULT_HEIGHT_RATIO));
}

function payloadBeforeStep(stepLogs: PipelineDebugStepResult[], targetStep: number): unknown {
  if (targetStep <= 0) return null;
  const prev = stepLogs.find((log) => log.step_index === targetStep - 1);
  return prev?.next_payload ?? null;
}

function priorSucceededBeforeStep(stepLogs: PipelineDebugStepResult[]): boolean {
  return stepLogs.every((log) => log.step_succeeded);
}

function buildRewindState(prev: DebugState, targetStep: number): DebugState {
  const keptLogs = prev.stepLogs.filter((log) => log.step_index < targetStep);
  const totalSteps = prev.totalSteps;
  return {
    stepIndex: targetStep,
    currentPayload: payloadBeforeStep(keptLogs, targetStep),
    priorRunSucceeded: targetStep === 0 ? true : priorSucceededBeforeStep(keptLogs),
    totalSteps,
    stepLogs: keptLogs,
    atEnd: totalSteps != null ? targetStep >= totalSteps : false,
  };
}

export default function PipelineDebugDrawer({
  open,
  pipelineUuid,
  onClose,
}: PipelineDebugDrawerProps) {
  const [debugState, setDebugState] = useState<DebugState>(INITIAL_DEBUG_STATE);
  const [stepPlan, setStepPlan] = useState<PipelineDebugStepPlan['steps']>([]);
  const [selectedRerunStep, setSelectedRerunStep] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(readStoredDrawerHeight);
  const resizingRef = useRef(false);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(0);

  const resetDebug = useCallback(() => {
    setDebugState(INITIAL_DEBUG_STATE);
    setStepPlan([]);
    setSelectedRerunStep(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetDebug();
  }, [open, resetDebug]);

  useEffect(() => {
    sessionStorage.setItem(DEBUG_DRAWER_HEIGHT_KEY, String(drawerHeight));
  }, [drawerHeight]);

  useEffect(() => {
    const stopResizing = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const onPointerMove = (clientY: number) => {
      if (!resizingRef.current) return;
      const delta = resizeStartYRef.current - clientY;
      setDrawerHeight(
        clampDrawerHeight(resizeStartHeightRef.current + delta),
      );
    };

    const onMouseMove = (event: MouseEvent) => {
      onPointerMove(event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!resizingRef.current) return;
      event.preventDefault();
      onPointerMove(event.touches[0]?.clientY ?? resizeStartYRef.current);
    };

    const onWindowResize = () => {
      setDrawerHeight((height) => clampDrawerHeight(height));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stopResizing);
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopResizing);
      window.removeEventListener('resize', onWindowResize);
      stopResizing();
    };
  }, []);

  const beginResize = (clientY: number) => {
    resizingRef.current = true;
    resizeStartYRef.current = clientY;
    resizeStartHeightRef.current = drawerHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizeMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    beginResize(event.clientY);
  };

  const handleResizeTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    beginResize(touch.clientY);
  };

  useEffect(() => {
    if (!open || !pipelineUuid) return;

    let cancelled = false;

    (async () => {
      setLoadingPlan(true);
      setError(null);
      try {
        const plan = await PipelineService.getDebugSteps(pipelineUuid, true);
        if (!cancelled) {
          setStepPlan(plan.steps);
          setDebugState((prev) => ({
            ...prev,
            totalSteps: plan.total_steps,
          }));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Failed to load debug step plan.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPlan(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, pipelineUuid]);

  const executedStepCount = debugState.stepLogs.length;

  const handleRunStep = async () => {
    if (!pipelineUuid || running || debugState.atEnd) return;
    if (debugState.totalSteps != null && debugState.stepIndex >= debugState.totalSteps) {
      return;
    }

    setRunning(true);
    setError(null);
    setSelectedRerunStep(null);

    try {
      const result = await PipelineService.runDebugStep(pipelineUuid, {
        step_index: debugState.stepIndex,
        current_payload: debugState.currentPayload,
        prior_run_succeeded: debugState.priorRunSucceeded,
      });

      setDebugState((prev) => {
        const nextStepIndex = prev.stepIndex + 1;
        const reachedEnd = result.is_last || nextStepIndex >= result.total_steps;
        return {
          stepIndex: nextStepIndex,
          currentPayload: result.next_payload ?? prev.currentPayload,
          priorRunSucceeded: prev.priorRunSucceeded && result.step_succeeded,
          totalSteps: result.total_steps,
          stepLogs: [...prev.stepLogs, result],
          atEnd: reachedEnd,
        };
      });
    } catch (err) {
      console.error(err);
      setError('Step execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleRerunFromSelected = () => {
    if (selectedRerunStep == null || running) return;
    setDebugState((prev) => buildRewindState(prev, selectedRerunStep));
    setSelectedRerunStep(null);
    setError(null);
  };

  const latestLog = debugState.stepLogs[debugState.stepLogs.length - 1] ?? null;
  const canRun =
    Boolean(pipelineUuid) &&
    !running &&
    !debugState.atEnd &&
    (debugState.totalSteps == null || debugState.stepIndex < debugState.totalSteps);
  const canRerunFromSelected =
    selectedRerunStep != null &&
    selectedRerunStep < debugState.stepIndex &&
    !running &&
    !loadingPlan;

  const stepLabel =
    debugState.totalSteps != null
      ? debugState.atEnd
        ? `Finished (${debugState.totalSteps}/${debugState.totalSteps})`
        : `Step ${Math.min(debugState.stepIndex + 1, debugState.totalSteps)} / ${debugState.totalSteps}`
      : 'Step —';

  const stepStatusByIndex = useMemo(() => {
    const map = new Map<number, PipelineDebugStepResult>();
    debugState.stepLogs.forEach((log) => map.set(log.step_index, log));
    return map;
  }, [debugState.stepLogs]);

  return (
    <Drawer
      title={
        <div className={styles.debugDrawerTitleWrap}>
          <div
            className={styles.debugDrawerResizeHandle}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize debug panel"
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
          />
          <span>Pipeline step debug</span>
        </div>
      }
      placement="bottom"
      height={drawerHeight}
      open={open}
      onClose={onClose}
      destroyOnHidden
      className={styles.debugDrawer}
      styles={{
        header: { position: 'relative' },
        body: { padding: '12px 20px', overflow: 'auto' },
      }}
    >
      {!pipelineUuid ? (
        <Alert
          type="warning"
          showIcon
          title="Save the pipeline first"
          description="Step debugging runs against the saved pipeline version. Save, then open debug again."
        />
      ) : (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.debugDrawerToolbar}>
            <Space wrap>
              <Button
                type="primary"
                size="small"
                icon={<CaretRightOutlined />}
                loading={running}
                disabled={!canRun || loadingPlan}
                onClick={() => void handleRunStep()}
              >
                Run
              </Button>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                disabled={!canRerunFromSelected}
                onClick={handleRerunFromSelected}
              >
                Re-run from step
              </Button>
              <Text type="secondary">{stepLabel}</Text>
              {latestLog ? statusTag(latestLog.status) : null}
              {latestLog?.execution_time_ms != null ? (
                <Text type="secondary">{latestLog.execution_time_ms} ms</Text>
              ) : null}
            </Space>
            {latestLog ? (
              <Text strong ellipsis style={{ maxWidth: 320 }}>
                {latestLog.node_name}
              </Text>
            ) : null}
          </div>

          {stepPlan.length > 0 ? (
            <div className={styles.debugStepStrip}>
              <Text type="secondary" className={styles.debugStepStripLabel}>
                Steps
              </Text>
              <div className={styles.debugStepStripItems}>
                {stepPlan.map((step) => {
                  const log = stepStatusByIndex.get(step.step_index);
                  const isExecuted = step.step_index < debugState.stepIndex;
                  const isCurrent = step.step_index === debugState.stepIndex && !debugState.atEnd;
                  const isSelected = selectedRerunStep === step.step_index;
                  const canSelect = isExecuted;

                  let tagColor: string | undefined;
                  if (log?.status === RUN_STATUS_FAILED) tagColor = 'error';
                  else if (log?.status === RUN_STATUS_SUCCESS) tagColor = 'success';
                  else if (isCurrent) tagColor = 'processing';

                  return (
                    <Tag
                      key={step.step_index}
                      color={isSelected ? 'blue' : tagColor}
                      className={canSelect ? styles.debugStepTagClickable : styles.debugStepTag}
                      onClick={
                        canSelect
                          ? () =>
                              setSelectedRerunStep((prev) =>
                                prev === step.step_index ? null : step.step_index,
                              )
                          : undefined
                      }
                    >
                      {step.step_index + 1}. {step.node_name}
                    </Tag>
                  );
                })}
              </div>
              {executedStepCount > 0 ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Click a completed step, then Re-run from step to rewind and execute again from
                  there.
                </Text>
              ) : null}
            </div>
          ) : null}

          {loadingPlan ? <Spin size="small" description="Loading steps…" /> : null}
          {error ? <Alert type="error" title={error} showIcon /> : null}

          {!latestLog && !loadingPlan ? (
            <Text type="secondary">
              Click Run to execute the first node. Each click runs the next node until the end.
            </Text>
          ) : null}

          {latestLog ? (
            <div className={styles.debugOutput}>
              <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                Step {latestLog.step_index} — {latestLog.node_name}
                {latestLog.skipped ? ' (skipped)' : ''}
              </Title>
              {latestLog.stdout_logs ? (
                <RunPayloadJsonBlock
                  label="Stdout"
                  data={latestLog.stdout_logs}
                  language="plaintext"
                  inlineMaxHeight={120}
                  emptyText="(empty)"
                />
              ) : null}
              <RunPayloadJsonBlock label="Input" data={latestLog.input_data} inlineMaxHeight={120} />
              <RunPayloadJsonBlock label="Output" data={latestLog.output_data} inlineMaxHeight={160} />
              {latestLog.error_traceback ? (
                <RunPayloadJsonBlock
                  label="Error"
                  data={latestLog.error_traceback}
                  language="plaintext"
                  inlineMaxHeight={120}
                />
              ) : null}
            </div>
          ) : null}

          {debugState.atEnd ? (
            <Alert
              type="info"
              showIcon
              title="Debug run complete"
              description="Select a step above to re-run from it, or use Reset in the toolbar to start over."
            />
          ) : null}
        </Space>
      )}
    </Drawer>
  );
}
