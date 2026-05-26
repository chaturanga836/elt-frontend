'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import { Input, Button, Card, Space, Breadcrumb, notification, Alert } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, CodeOutlined, WarningOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { TaskService } from '@/services/task.service';
import { ExternalLinkService } from '@/services/external-link.service';
import { detectExternalUrls, UrlViolation } from '@/lib/validateExternalUrls';
import Link from 'next/link';

export default function TaskCanvas() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    script: '# Write your python logic here\n# External URLs are blocked. Use registered connections or external links.\n\ndef main(input_data):\n    return input_data'
  });

  const [violations, setViolations] = useState<UrlViolation[]>([]);
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    ExternalLinkService.list({ limit: 500 })
      .then((res) => setAllowedUrls(res.items.map((l) => l.url)))
      .catch(() => {});
  }, []);

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
      await TaskService.createTask(taskData);
      api.success({
        message: 'Task Created',
        description: 'Task created successfully.',
      });
      router.push('/task');
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
          description: 'Failed to create task. Please try again.',
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
            <Breadcrumb items={[{ title: <Link href="/task">Tasks</Link> }, { title: 'New Task' }]} />
            <h2 style={{ margin: 0 }}>Create Independent Task</h2>
          </Space>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Cancel</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSave}
              disabled={violations.length > 0}
            >
              Save Task
            </Button>
          </Space>
        </div>

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
            title={<Space><CodeOutlined /> Python Script</Space>}
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
      </div>
    </>
  );
}