'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
  notification,
} from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { ReportDefinition, ReportService } from '@/services/report.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const { Text } = Typography;

type Props = {
  runId: number;
  pipelineUuid?: string;
};

export default function RunReportPanel({ runId, pipelineUuid }: Props) {
  const workspaceId = useWorkspaceId();
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [definitionId, setDefinitionId] = useState<number | null>(null);
  const [loadingDefs, setLoadingDefs] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await ReportService.list({ workspace_id: workspaceId, limit: 100 });
        if (cancelled) return;
        const merged = all.items.filter(
          (d) =>
            !d.pipeline_uuid ||
            !pipelineUuid ||
            d.pipeline_uuid === pipelineUuid,
        );
        setDefinitions(merged);
        if (merged.length === 1) {
          setDefinitionId(merged[0].id);
        }
      } catch {
        notification.error({ message: 'Failed to load report templates' });
      } finally {
        if (!cancelled) setLoadingDefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, pipelineUuid]);

  const selected = definitions.find((d) => d.id === definitionId);

  const openPreview = async () => {
    if (!definitionId) return;
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const preview = await ReportService.preview(runId, definitionId);
      setPreviewHtml(preview.html);
    } catch {
      notification.error({ message: 'Failed to generate preview' });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const download = async (format: 'html' | 'csv' | 'json') => {
    if (!definitionId || !selected) return;
    try {
      const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'html';
      await ReportService.downloadExport(
        runId,
        definitionId,
        format,
        `${selected.name.replace(/\s+/g, '_')}_run_${runId}.${ext}`,
      );
    } catch {
      notification.error({ message: 'Download failed' });
    }
  };

  if (loadingDefs) {
    return <Spin size="small" />;
  }

  if (definitions.length === 0) {
    return (
      <Card size="small">
        <Text type="secondary">
          No report templates yet. Create one under Reports in the sidebar to export run data.
        </Text>
      </Card>
    );
  }

  return (
    <>
      <Card size="small" title="Export report">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Select
            style={{ width: '100%', maxWidth: 400 }}
            placeholder="Select report template"
            value={definitionId ?? undefined}
            onChange={setDefinitionId}
            options={definitions.map((d) => ({
              value: d.id,
              label: d.pipeline_uuid ? `${d.name} (pipeline)` : d.name,
            }))}
          />
          <Space wrap>
            <Button
              icon={<EyeOutlined />}
              disabled={!definitionId}
              onClick={() => void openPreview()}
            >
              Preview
            </Button>
            <Button
              icon={<DownloadOutlined />}
              disabled={!definitionId}
              onClick={() => void download('html')}
            >
              HTML
            </Button>
            <Button disabled={!definitionId} onClick={() => void download('csv')}>
              CSV
            </Button>
            <Button disabled={!definitionId} onClick={() => void download('json')}>
              JSON
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        title={selected ? `Preview: ${selected.name}` : 'Report preview'}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            Close
          </Button>,
          <Button
            key="html"
            type="primary"
            disabled={!definitionId}
            onClick={() => void download('html')}
          >
            Download HTML
          </Button>,
        ]}
      >
        {previewLoading ? (
          <Spin />
        ) : (
          <iframe
            title="Report preview"
            srcDoc={previewHtml}
            style={{ width: '100%', height: '60vh', border: '1px solid #eee', borderRadius: 8 }}
          />
        )}
      </Modal>
    </>
  );
}
