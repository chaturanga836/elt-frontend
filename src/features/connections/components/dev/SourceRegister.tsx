'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  message,
  Breadcrumb,
  Row,
  Col
} from 'antd';
import {
  SaveOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from "@/services/connection.service";
const { Title, Text } = Typography;

export default function SourceRegister() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      console.log('Registering Source:', values);
      await connectionService.registerConnection(values); // Simulate API call
      // Simulate API call
      //   await new Promise(resolve => setTimeout(resolve, 800));
      messageApi.open({ content: 'Source provider registered successfully', type: 'success' });
      router.push('/connections/connection-dev');
    } catch (error) {
      console.error('Error registering source:', error);
      messageApi.open({ content: 'Failed to register source', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {contextHolder}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { title: 'Connections' },
              { title: <a onClick={() => router.push('/connections/connection-dev')}>Development</a> },
              { title: 'Register Source' },
            ]}
            className="mb-4"
          />
          <div className="flex justify-between items-center">
            <div>
              <Title level={2} style={{ margin: 0 }}>Register New Source</Title>
              <Text type="secondary">Define a new connector type available for the integration catalog</Text>
            </div>
            <Space>
              <Button onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="primary" onClick={() => form.submit()} suppressHydrationWarning={true} icon={<SaveOutlined />} loading={submitting}>
                Save Source
              </Button>
            </Space>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col span={16}>

              <Card title="Source Details" variant={"outlined"} className="shadow-sm mb-6">
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter source name' }]}>
                  <Input placeholder="e.g. Stripe API" suppressHydrationWarning={true} />
                </Form.Item>
                <Form.Item label="Description" name="description">
                  <Input.TextArea rows={4} placeholder="Description..." suppressHydrationWarning={true} />
                </Form.Item>
              </Card>
            </Col>

          </Row>
        </Form>
      </div>
    </>
  );
}