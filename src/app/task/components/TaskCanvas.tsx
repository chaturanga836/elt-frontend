'use client';

import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Input, Button, Card, Space, Breadcrumb, notification } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, CodeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { TaskService } from '@/services/task.service';
import Link from 'next/link';

export default function TaskCanvas() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    script: '# Write your python logic here\n\ndef main(input_data):\n    return input_data'
  });

  const handleSave = async () => {
    if (!taskData.name) {
      return notification.error({ message: 'Task name is required' });
    }

    try {
      setLoading(true);
      await TaskService.createTask(taskData);
      notification.success({ message: 'Task created successfully' });
      router.push('/task'); // Go back to list
    } catch (err) {
      console.error(err);
      notification.error({ message: 'Failed to create task' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space orientation="vertical" size={0}>
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
          >
            Save Task
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left Side: Metadata */}
        <Card style={{ width: '350px' }} title="Task Details">
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
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

        {/* Right Side: Code Editor */}
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
            onChange={(value) => setTaskData({ ...taskData, script: value || '' })}
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
  );
}