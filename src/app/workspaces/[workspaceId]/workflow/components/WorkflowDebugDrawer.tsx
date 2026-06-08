'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Drawer, Space, Spin, Tag, Typography } from 'antd';
import { CaretRightOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  WorkflowService,
  WorkflowDebugStepPlan,
  WorkflowDebugStepResult,
} from '@/services/workflow.service';
import RunPayloadJsonBlock from '../../pipe/components/RunPayloadJsonBlock';

const { Text, Title } = Typography;

type DebugState = {
  stepIndex: number;
  currentPayload: unknown;
  forkPayload: unknown | null;
  branchOutputs: Record<string, unknown>;
  priorRunSucceeded: boolean;
  totalSteps: number | null;
  stepLogs: WorkflowDebugStepResult[];
  atEnd: boolean;
};

const INITIAL: DebugState = {
  stepIndex: 0,
  currentPayload: null,
  forkPayload: null,
  branchOutputs: {},
  priorRunSucceeded: true,
  totalSteps: null,
  stepLogs: [],
  atEnd: false,
};

type Props = {
  open: boolean;
  workflowUuid: string | null;
  onClose: () => void;
};

function statusTag(status: number) {
  if (status === 2) return <Tag color="success">OK</Tag>;
  if (status === 3) return <Tag color="error">Failed</Tag>;
  return <Tag>—</Tag>;
}

function kindLabel(kind: string) {
  const map: Record<string, string> = {
    start_pass: 'Start',
    start_hook: 'Start hook',
    exec: 'Node',
    condition: 'If / Else',
    parallel_fork: 'Parallel split',
    parallel_branch: 'Parallel branch',
    parallel_join: 'Parallel join',
    end_pass: 'End',
    end_hook: 'End hook',
  };
  return map[kind] || kind;
}

export default function WorkflowDebugDrawer({ open, workflowUuid, onClose }: Props) {
  const [debugState, setDebugState] = useState<DebugState>(INITIAL);
  const [stepPlan, setStepPlan] = useState<WorkflowDebugStepPlan['steps']>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetDebug = useCallback(() => {
    setDebugState(INITIAL);
    setStepPlan([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetDebug();
  }, [open, resetDebug]);

  const loadPlan = useCallback(async () => {
    if (!workflowUuid) return;
    setLoadingPlan(true);
    setError(null);
    try {
      const plan = await WorkflowService.getDebugSteps(workflowUuid, {
        current_payload: debugState.currentPayload,
        prior_run_succeeded: debugState.priorRunSucceeded,
      });
      setStepPlan(plan.steps);
      setDebugState((prev) => ({ ...prev, totalSteps: plan.total_steps }));
    } catch {
      setError('Failed to load debug step plan.');
    } finally {
      setLoadingPlan(false);
    }
  }, [workflowUuid, debugState.currentPayload, debugState.priorRunSucceeded]);

  useEffect(() => {
    if (!open || !workflowUuid) return;
    void loadPlan();
  }, [open, workflowUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStepMeta = stepPlan[debugState.stepIndex];

  const handleRunStep = async () => {
    if (!workflowUuid || running || debugState.atEnd) return;

    setRunning(true);
    setError(null);

    try {
      const result = await WorkflowService.runDebugStep(workflowUuid, {
        step_index: debugState.stepIndex,
        current_payload: debugState.currentPayload,
        fork_payload: debugState.forkPayload,
        branch_outputs: debugState.branchOutputs,
        prior_run_succeeded: debugState.priorRunSucceeded,
      });

      setDebugState((prev) => {
        let forkPayload = prev.forkPayload;
        let branchOutputs = { ...prev.branchOutputs };

        if (result.parallel_context) {
          forkPayload = result.parallel_context.fork_payload;
        }
        if (result.branch_update) {
          branchOutputs[result.branch_update.branch_start_uuid] =
            result.branch_update.branch_output;
        }

        const nextIndex = prev.stepIndex + 1;
        const reachedEnd = result.is_last || nextIndex >= result.total_steps;

        return {
          stepIndex: nextIndex,
          currentPayload: result.next_payload ?? prev.currentPayload,
          forkPayload,
          branchOutputs,
          priorRunSucceeded: prev.priorRunSucceeded && result.step_succeeded,
          totalSteps: result.total_steps,
          stepLogs: [...prev.stepLogs, result],
          atEnd: reachedEnd,
        };
      });

      if (result.kind === 'condition') {
        void loadPlan();
      }
    } catch {
      setError('Step execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const latestLog = debugState.stepLogs[debugState.stepLogs.length - 1] ?? null;
  const branchKeys = Object.keys(debugState.branchOutputs);

  const stepLabel = useMemo(() => {
    if (debugState.totalSteps == null) return 'Step —';
    if (debugState.atEnd) {
      return `Finished (${debugState.totalSteps}/${debugState.totalSteps})`;
    }
    return `Step ${Math.min(debugState.stepIndex + 1, debugState.totalSteps)} / ${debugState.totalSteps}`;
  }, [debugState]);

  const canRun =
    Boolean(workflowUuid) &&
    !running &&
    !debugState.atEnd &&
    (debugState.totalSteps == null || debugState.stepIndex < debugState.totalSteps);

  return (
    <Drawer
      title="Workflow step debug"
      placement="bottom"
      height={360}
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: '12px 20px', overflow: 'auto' } }}
    >
      {!workflowUuid ? (
        <Alert type="warning" showIcon message="Save the workflow before debugging." />
      ) : (
        <>
          <Space wrap style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              size="small"
              icon={<CaretRightOutlined />}
              loading={running}
              disabled={!canRun || loadingPlan}
              onClick={() => void handleRunStep()}
            >
              Run step
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => resetDebug()}>
              Reset
            </Button>
            <Text type="secondary">{stepLabel}</Text>
            {latestLog ? statusTag(latestLog.status) : null}
            {currentStepMeta?.branch_label ? (
              <Tag color="cyan">{currentStepMeta.branch_label}</Tag>
            ) : null}
            {currentStepMeta ? (
              <Tag>{kindLabel(currentStepMeta.kind)}</Tag>
            ) : null}
          </Space>

          {error ? (
            <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />
          ) : null}

          {loadingPlan ? <Spin size="small" /> : null}

          {debugState.forkPayload != null ? (
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 12 }}>
                Parallel fork input (shared by each branch)
              </Text>
              <RunPayloadJsonBlock payload={debugState.forkPayload} />
            </div>
          ) : null}

          {branchKeys.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Branch outputs ({branchKeys.length} collected)
              </Text>
              {branchKeys.map((key) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <Text code style={{ fontSize: 11 }}>
                    {key}
                  </Text>
                  <RunPayloadJsonBlock payload={debugState.branchOutputs[key]} />
                </div>
              ))}
            </div>
          ) : null}

          {currentStepMeta?.kind === 'parallel_join' && branchKeys.length === 0 ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Step through each parallel branch before running the join step."
            />
          ) : null}

          {latestLog ? (
            <div>
              <Title level={5} style={{ marginTop: 0 }}>
                {latestLog.node_name}
                {latestLog.branch_label ? (
                  <Tag color="cyan" style={{ marginLeft: 8 }}>
                    {latestLog.branch_label}
                  </Tag>
                ) : null}
              </Title>
              {latestLog.error_traceback ? (
                <Alert
                  type="error"
                  showIcon
                  message="Step failed"
                  description={
                    <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                      {latestLog.error_traceback}
                    </pre>
                  }
                  style={{ marginBottom: 12 }}
                />
              ) : null}
              <Text strong style={{ fontSize: 12 }}>
                Input
              </Text>
              <RunPayloadJsonBlock payload={latestLog.input_data} />
              <Text strong style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Output
              </Text>
              <RunPayloadJsonBlock payload={latestLog.output_data} />
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Run steps one at a time. Parallel branches execute sequentially in debug — step
              through branch-0, then branch-1, then the join merges their outputs.
            </Text>
          )}
        </>
      )}
    </Drawer>
  );
}
