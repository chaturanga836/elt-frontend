'use client';

import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Spin, message, Button } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';

const { Title, Text } = Typography;

interface PrototypePickerProps {
  categoryId: number;
  title: string;
  basePath: string;
  backHref?: string;
}

interface PrototypeItem {
  id: string;
  name: string;
  label: string;
  description?: string;
}

export default function PrototypePicker({
  categoryId,
  title,
  basePath,
  backHref = '/connections',
}: PrototypePickerProps) {
  const router = useRouter();
  const [prototypes, setPrototypes] = useState<PrototypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await connectionService.getPrototypes(categoryId);
        setPrototypes(data);
      } catch {
        message.error('Failed to load connection types');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(backHref)}
        className="mb-4 px-0"
      >
        Back to Connections
      </Button>
      <Title level={2}>{title}</Title>
      <Text type="secondary" className="block mb-6">
        Choose the type you want to connect
      </Text>

      <Row gutter={[24, 24]}>
        {prototypes.map((proto) => (
          <Col xs={24} sm={12} md={8} key={proto.id}>
            <Card
              hoverable
              className="h-full border-2 hover:border-blue-500 transition-all"
              onClick={() => router.push(`${basePath}/new/${proto.id}`)}
            >
              <div className="text-3xl text-blue-500 mb-3">
                <DatabaseOutlined />
              </div>
              <Text strong>{proto.label}</Text>
              {proto.description && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {proto.description}
                  </Text>
                </>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
