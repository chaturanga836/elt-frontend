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
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from "@/services/connection.service";

const { Title, Text } = Typography;

export default function SourceRegister() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ensure the component only renders logic on the client to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // Using your connection service to hit the backend
      await connectionService.registerConnection(values); 
      
      // Using static message API to avoid build-time "not iterable" errors
      message.success('Source provider registered successfully');
      
      router.push('/connections/connection-dev');
    } catch (error) {
      console.error('Error registering source:', error);
      message.error('Failed to register source. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent SSR issues during 'next build'
  if (!isMounted) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: 'Connections' },
            { 
              title: (
                <a onClick={() => router.push('/connections/connection-dev')}>
                  Development
                </a>
              ) 
            },
            { title: 'Register Source' },
          ]}
          className="mb-4"
        />
        
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} style={{ margin: 0 }}>Register New Source</Title>
            <Text type="secondary">
              Define a new connector type available for the integration catalog
            </Text>
          </div>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              onClick={() => form.submit()} 
              icon={<SaveOutlined />} 
              loading={submitting}
            >
              Save Source
            </Button>
          </Space>
        </div>
      </div>

      {/* Form Section */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        <Row gutter={24}>
          <Col span={16}>
            <Card 
              title="Source Details" 
              variant="outlined" 
              className="shadow-sm mb-6"
            >
              <Form.Item 
                label="Source Name" 
                name="name" 
                rules={[{ required: true, message: 'Please enter source name' }]}
              >
                <Input placeholder="e.g. Stripe API, Salesforce, Shopify" />
              </Form.Item>
              
              <Form.Item 
                label="Description" 
                name="description"
                rules={[{ required: true, message: 'Please provide a short description' }]}
              >
                <Input.TextArea 
                  rows={4} 
                  placeholder="What is this source used for? Mention API versions or specific limitations." 
                />
              </Form.Item>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="Help & Documentation" variant="outlined" className="shadow-sm">
              <Text type="secondary">
                Registering a source provider makes it available for other users in your workspace to configure individual connections.
              </Text>
              <div className="mt-4">
                <ul className="pl-4 text-xs text-gray-500 list-disc">
                  <li>Ensure the name is unique.</li>
                  <li>Descriptions help users choose the right connector.</li>
                  <li>Icon configuration can be updated later.</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}