'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, message, Empty } from 'antd';
import { useConnectionStore } from '@/store/useConnectionStore';
import { connectionService } from '@/services/connection.service';
import { ConnectionCategory } from '@/types/connection';
import * as Icons from '@ant-design/icons';

const { Title, Text } = Typography;

export default function CategorySelector() {
  const [categories, setCategories] = useState<ConnectionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const setCategory = useConnectionStore((state) => state.setCategory);

useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        
        // Destructure the 'data' property from the returned object
        const { data } = await connectionService.getCategories();
        
        // Now 'data' is the array [ {id: "1", ...} ]
        setCategories(data); 
        
      } catch (err) {
        console.error("API Error:", err);
        message.error("Failed to load connection categories from server.");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  if (loading) return <div className="text-center py-20"><Spin size="large" description="Fetching categories..." /></div>;
  if (categories.length === 0) return <Empty description="No categories found" />;

  return (
    <div className="py-8">
      <Row gutter={[24, 24]}>
        {categories.map((cat) => {
          // Dynamically resolve icon if your backend sends an icon name
          const IconComponent = (Icons as any)[cat.icon || 'ApiOutlined'] || Icons.ApiOutlined;
          
          return (
            <Col xs={24} sm={8} key={cat.id}>
              <Card
                hoverable
                className="text-center h-full border-gray-100 hover:border-blue-400 transition-all shadow-sm"
                onClick={() => setCategory(cat)}
              >
                <div className="mb-4 text-3xl text-blue-500">
                  <IconComponent />
                </div>
                <Title level={5}>{cat.name}</Title>
                <Text type="secondary">{cat.description}</Text>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}