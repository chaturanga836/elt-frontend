'use client';

import { useState } from 'react';
import { Alert, DatePicker, Form, Input, Modal, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PipelineService } from '@/services/pipe.service';

const { Text } = Typography;

type Props = {
  open: boolean;
  pipelineUuid: string | null;
  pipelineName?: string;
  onClose: () => void;
  onSuccess?: (batchId: string) => void;
};

export default function PipelineBackfillModal({
  open,
  pipelineUuid,
  pipelineName,
  onClose,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [dateField, setDateField] = useState('sync_date');

  const handleSubmit = async () => {
    if (!pipelineUuid) {
      message.error('Save and publish the pipeline first.');
      return;
    }
    if (!dateRange?.[0] || !dateRange?.[1]) {
      message.error('Select a start and end date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await PipelineService.runPipelineBackfill(pipelineUuid, {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        date_field: dateField.trim() || 'sync_date',
      });
      message.success(`Backfill started: ${res.total_days} runs queued`);
      onSuccess?.(res.backfill_batch_id);
      onClose();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || 'Backfill failed';
      message.error(typeof detail === 'string' ? detail : 'Backfill failed');
    } finally {
      setSubmitting(false);
    }
  };

  const dayCount =
    dateRange?.[0] && dateRange?.[1]
      ? dateRange[1].diff(dateRange[0], 'day') + 1
      : null;

  return (
    <Modal
      title={`Date range backfill${pipelineName ? `: ${pipelineName}` : ''}`}
      open={open}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      okText="Start backfill"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="One run per day"
        description={
          <>
            Each day gets its own pipeline run with{' '}
            <Text code>{dateField || 'sync_date'}</Text> in run input. Use{' '}
            <Text code>{`{{${dateField || 'sync_date'}}}`}</Text> in your REST node URL,
            query, or body.
          </>
        }
      />

      <Form layout="vertical">
        <Form.Item label="Date range" required>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null)
            }
            disabledDate={(current) => current.isAfter(dayjs(), 'day')}
          />
        </Form.Item>
        {dayCount != null ? (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            {dayCount} pipeline run{dayCount === 1 ? '' : 's'} will be queued (max 366).
          </Text>
        ) : null}
        <Form.Item
          label="Input field name"
          extra="Key on each run's input_payload"
        >
          <Input
            value={dateField}
            onChange={(e) => setDateField(e.target.value)}
            placeholder="sync_date"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
