'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Drawer, Space, Spin, Typography } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import {
  PipelineService,
  PipelineDebugStepResult,
} from '@/services/pipe.service';
import RunPayloadJsonBlock from './RunPayloadJsonBlock';
import { statusTag } from './runDetailUtils';
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

export default function PipelineDebugDrawer({
  open,
  pipelineUuid,
  onClose,
}: PipelineDebugDrawerProps) {
  const [debugState, setDebugState] = useState<DebugState>(INITIAL_DEBUG_STATE);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetDebug = useCallback(() => {
    setDebugState(INITIAL_DEBUG_STATE);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetDebug();
  }, [open, resetDebug]);

  useEffect(() => {
    if (!open || !pipelineUuid) return;

    let cancelled = false;

    (async () => {
      setLoadingPlan(true);
      setError(null);
      try {
        const plan = await PipelineService.getDebugSteps(pipelineUuid, true);
        if (!cancelled) {
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

  const handleRunStep = async () => {
    if (!pipelineUuid || running || debugState.atEnd) return;
    if (debugState.totalSteps != null && debugState.stepIndex >= debugState.totalSteps) {
      return;
    }

    setRunning(true);
    setError(null);

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

  const latestLog = debugState.stepLogs[debugState.stepLogs.length - 1] ?? null;
  const canRun =
    Boolean(pipelineUuid) &&
    !running &&
    !debugState.atEnd &&
    (debugState.totalSteps == null || debugState.stepIndex < debugState.totalSteps);

  const stepLabel =
    debugState.totalSteps != null
      ? debugState.atEnd
        ? `Finished (${debugState.totalSteps}/${debugState.totalSteps})`
        : `Step ${Math.min(debugState.stepIndex + 1, debugState.totalSteps)} / ${debugState.totalSteps}`
      : 'Step —';

  return (
    <Drawer
      title="Pipeline step debug"
      placement="bottom"
      height="42vh"
      open={open}
      onClose={onClose}
      destroyOnHidden
      className={styles.debugDrawer}
      styles={{
        body: { padding: '12px 20px', overflow: 'auto' },
      }}
    >
      {!pipelineUuid ? (
        <Alert
          type="warning"
          showIcon
          message="Save the pipeline first"
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

          {loadingPlan ? (<Spin size="small" >Loading steps...</Spin>) : null}
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
              description="Use Reset in the toolbar or close and reopen this panel to start over."
            />
          ) : null}
        </Space>
      )}
    </Drawer>
  );
}
