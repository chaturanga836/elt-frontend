'use client';

import { Input, Space, Typography } from 'antd';
import { useConnectionStore } from '@/store/useConnectionStore';

const { Text } = Typography;

export default function BasicAuth() {
  // 1. Pull basicAuth data and the specific update action
  const basicAuth = useConnectionStore((state) => state.basicAuth);
  const updateBasicAuth = useConnectionStore((state) => state.updateBasicAuth);

  return (
    <div className="max-w-md space-y-4 animate-in fade-in duration-300">
      <Space orientation="vertical" className="w-full" size={12}>
        <div>
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
            Username
          </Text>
          <Input 
            placeholder="admin" 
            variant="filled" 
            className="font-mono text-sm"
            value={basicAuth.username}
            onChange={(e) => updateBasicAuth({ username: e.target.value })}
          />
        </div>
        <div>
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
            Password
          </Text>
          <Input.Password 
            placeholder="••••••••" 
            variant="filled" 
            className="font-mono text-sm"
            value={basicAuth.password}
            onChange={(e) => updateBasicAuth({ password: e.target.value })}
          />
        </div>
      </Space>

      <div className="bg-blue-50/50 p-3 rounded border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
        <Text type="secondary" className="text-[11px]">
          Note: Basic auth will be sent as a Base64 encoded string in the <Text code>Authorization</Text> header.
        </Text>
      </div>
    </div>
  );
}