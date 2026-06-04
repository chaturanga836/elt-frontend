'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import { Input, Button, Card, Space, Breadcrumb, notification, Alert, Modal, List, Tag, Typography } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, CodeOutlined, WarningOutlined, LinkOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { TaskService } from '@/services/task.service';
import { ExternalLinkService } from '@/services/external-link.service';
import { connectionService } from '@/services/connection.service';
import { detectExternalUrls, UrlViolation } from '@/lib/validateExternalUrls';
import Link from 'next/link';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

type ConnectionRecord = {
  id: number;
  name: string;
  source_type: string;
  url?: string;
  description?: string;
  prototype_id?: string;
};

const SOURCE_LABELS: Record<string, string> = {
  'rest-api': 'REST API',
  db: 'Database',
  file: 'Storage',
};

export default function TaskCanvas({ taskId }: { taskId?: number } = {}) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { Text } = Typography;
  const isEditMode = taskId != null && taskId > 0;
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(isEditMode);
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    script: '# Write your python logic here\n# External URLs are blocked. Use registered connections or external links.\n\ndef main(input_data):\n    return input_data'
  });

  const [violations, setViolations] = useState<UrlViolation[]>([]);
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [connectionSearch, setConnectionSearch] = useState('');
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    ExternalLinkService.list({ limit: 500, workspace_id: workspaceId })
      .then((res) => setAllowedUrls(res.items.map((l) => l.url)))
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (!isEditMode || !taskId) return;

    let alive = true;
    (async () => {
      try {
        setHydrating(true);
        const task = await TaskService.getTask(taskId);
        if (!alive) return;
        setTaskData({
          name: task.name || '',
          description: task.description || '',
          script: task.script || '',
        });
      } catch {
        if (alive) {
          notification.error({ message: 'Failed to load task' });
          router.push(workspacePath(workspaceId, 'task'));
        }
      } finally {
        if (alive) setHydrating(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEditMode, taskId, router, workspaceId]);

  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await connectionService.getUnifiedConnections(workspaceId);
      const normalized = (Array.isArray(res) ? res : []).map((row: any) => ({
        id: Number(row.id),
        name: String(row.name || `Connection ${row.id}`),
        source_type: String(row.source_type || 'rest-api'),
        url: row.url ? String(row.url) : undefined,
        description: row.description ? String(row.description) : undefined,
        prototype_id: row.prototype_id ? String(row.prototype_id) : undefined,
      }));
      setConnections(normalized.filter((c) => Number.isFinite(c.id)));
    } catch {
      setConnectionsError('Failed to load connections. Please try again.');
      setConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isConnectionModalOpen && connections.length === 0 && !connectionsLoading) {
      void loadConnections();
    }
  }, [isConnectionModalOpen, connections.length, connectionsLoading, loadConnections]);

  const validateCode = useCallback(
    (code: string) => {
      const found = detectExternalUrls(code, allowedUrls);
      setViolations(found);

      if (editorRef.current && monacoRef.current) {
        const monaco = monacoRef.current;
        const model = editorRef.current.getModel();
        if (model) {
          const markers = found.map((v) => ({
            severity: monaco.MarkerSeverity.Error,
            message: `Unauthorized external URL: "${v.url}"\nRegister it in External Links Registry or use a connection reference.`,
            startLineNumber: v.line,
            startColumn: v.startCol,
            endLineNumber: v.line,
            endColumn: v.endCol,
          }));
          monaco.editor.setModelMarkers(model, 'url-validator', markers);
        }
      }

      return found;
    },
    [allowedUrls],
  );

  useEffect(() => {
    if (taskData.script) {
      validateCode(taskData.script);
    }
  }, [allowedUrls, validateCode, taskData.script]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    validateCode(taskData.script);
  };

  const handleEditorChange = (value: string | undefined) => {
    const code = value || '';
    setTaskData({ ...taskData, script: code });
    validateCode(code);
  };

  const buildConnectionSnippet = (connection: ConnectionRecord) => {
    const payload = {
      id: connection.id,
      name: connection.name,
      source_type: connection.source_type,
      prototype_id: connection.prototype_id || null,
    };
    return (
      `\n# Connection reference (metadata only — no HTTP from task scripts)\n` +
      `# For scraper/REST calls: add a REST Endpoint node on the pipeline canvas.\n` +
      `connection_ref = ${JSON.stringify(payload, null, 2)}\n`
    );
  };

  const insertSnippetInEditor = (snippet: string) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) {
      const next = `${taskData.script}${snippet}`;
      setTaskData((prev) => ({ ...prev, script: next }));
      validateCode(next);
      return;
    }

    const selection = editor.getSelection();
    const range =
      selection ||
      new monaco.Range(
        editor.getModel().getLineCount(),
        editor.getModel().getLineMaxColumn(editor.getModel().getLineCount()),
        editor.getModel().getLineCount(),
        editor.getModel().getLineMaxColumn(editor.getModel().getLineCount()),
      );

    editor.executeEdits('connection-snippet', [{ range, text: snippet, forceMoveMarkers: true }]);
    const updatedCode = editor.getValue();
    setTaskData((prev) => ({ ...prev, script: updatedCode }));
    validateCode(updatedCode);
  };

  const handleInsertConnection = (connection: ConnectionRecord) => {
    insertSnippetInEditor(buildConnectionSnippet(connection));
    setIsConnectionModalOpen(false);
    api.success({
      message: 'Connection inserted',
      description: `"${connection.name}" reference added to script.`,
    });
  };

  const filteredConnections = connections.filter((c) => {
    const q = connectionSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.source_type.toLowerCase().includes(q) ||
      (c.prototype_id || '').toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!taskData.name) {
      return notification.error({ message: 'Task name is required' });
    }

    const currentViolations = detectExternalUrls(taskData.script, allowedUrls);
    if (currentViolations.length > 0) {
      return api.error({
        message: 'External URLs Detected',
        description: `Found ${currentViolations.length} unauthorized URL(s). Register them in External Links or remove them.`,
      });
    }

    try {
      setLoading(true);
      const payload = {
        name: taskData.name,
        script: taskData.script,
      };

      if (isEditMode && taskId) {
        await TaskService.updateTask(taskId, payload);
        api.success({
          message: 'Task Updated',
          description: 'Task saved successfully.',
        });
      } else {
        await TaskService.createTask(payload);
        api.success({
          message: 'Task Created',
          description: 'Task created successfully.',
        });
      }
      router.push(workspacePath(workspaceId, 'task'));
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      if (detail?.blocked_urls) {
        api.error({
          message: 'External URLs Blocked',
          description: `Server rejected: ${detail.blocked_urls.join(', ')}`,
        });
      } else {
        api.error({
          message: 'Error',
          description: isEditMode
            ? 'Failed to update task. Please try again.'
            : 'Failed to create task. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space direction="vertical" size={0}>
            <Breadcrumb
              items={[
                { title: <Link href={workspacePath(workspaceId, 'task')}>Tasks</Link> },
                { title: isEditMode ? 'Edit Task' : 'New Task' },
              ]}
            />
            <h2 style={{ margin: 0 }}>
              {isEditMode ? 'Edit Task' : 'Create Independent Task'}
            </h2>
          </Space>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Cancel</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading || hydrating}
              onClick={handleSave}
              disabled={violations.length > 0 || hydrating}
            >
              {isEditMode ? 'Update Task' : 'Save Task'}
            </Button>
          </Space>
        </div>

        {hydrating ? (
          <Card loading style={{ flex: 1 }} />
        ) : (
        <>
        {violations.length > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message={`${violations.length} unauthorized external URL(s) detected`}
            description={
              <div>
                <span>External links must be registered before use. </span>
                <Link href="/external-links">Go to External Links Registry</Link>
                <ul style={{ margin: '8px 0 0', paddingLeft: 16 }}>
                  {violations.slice(0, 5).map((v, i) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      Line {v.line}: <code>{v.url}</code>
                    </li>
                  ))}
                  {violations.length > 5 && (
                    <li style={{ fontSize: 12 }}>...and {violations.length - 5} more</li>
                  )}
                </ul>
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          <Card style={{ width: '350px' }} title="Task Details">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Task Name</label>
                <Input
                  placeholder="e.g., Clean Customer Data"
                  value={taskData.name}
                  onChange={(e) => setTaskData({ ...taskData, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Description</label>
                <Input.TextArea
                  rows={4}
                  placeholder="What does this script do?"
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                />
              </div>
            </Space>
          </Card>

          <Card
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space><CodeOutlined /> Python Script</Space>
                <Button icon={<LinkOutlined />} onClick={() => setIsConnectionModalOpen(true)}>
                  Insert Connection
                </Button>
              </Space>
            }
            styles={{ body: { flex: 1, padding: 0, overflow: 'hidden' } }}
          >
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={taskData.script}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </Card>
        </div>
        </>
        )}
      </div>
      <Modal
        title="Insert Connection Reference"
        open={isConnectionModalOpen}
        onCancel={() => setIsConnectionModalOpen(false)}
        footer={null}
        width={720}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder="Search by name, type, or prototype"
            value={connectionSearch}
            onChange={(e) => setConnectionSearch(e.target.value)}
          />

          {connectionsError && (
            <Alert
              type="error"
              showIcon
              message={connectionsError}
              action={
                <Button size="small" onClick={() => void loadConnections()} loading={connectionsLoading}>
                  Retry
                </Button>
              }
            />
          )}

          <List
            bordered
            loading={connectionsLoading}
            locale={{ emptyText: 'No connections found' }}
            dataSource={filteredConnections}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key={`insert-${item.id}`} type="link" onClick={() => handleInsertConnection(item)}>
                    Insert
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.name}</Text>
                      <Tag>{SOURCE_LABELS[item.source_type] || item.source_type}</Tag>
                      {item.prototype_id ? <Tag color="blue">{item.prototype_id}</Tag> : null}
                    </Space>
                  }
                  description={item.url || item.description || 'No details available'}
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </>
  );
}