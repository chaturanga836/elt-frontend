'use client';

import { Button, Card, Typography, Space, Divider } from 'antd';
import { PlusOutlined, ApiOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import ConnectionsTable from '@/features/connections/components/ConnectionTable';

const { Title, Paragraph } = Typography;

export default function Home() {

  return (
    <React.Fragment>
      <ConnectionsTable />
    </React.Fragment>  );
}