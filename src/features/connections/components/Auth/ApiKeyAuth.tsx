'use client';

import { Input, Select, Space, Typography } from 'antd';
import { useConnectionStore } from '@/store/useConnectionStore';

const { Text } = Typography;

export default function ApiKeyAuth() {
  // 1. Connect to Store
  const apiKey = useConnectionStore((state) => state.apiKeyAuth);
  const updateApiKey = useConnectionStore((state) => state.updateApiKeyAuth);

  return (
    <div className="max-w-2xl animate-in fade-in duration-300">
      <div className="grid grid-cols-2 gap-6">
        <Space orientation="vertical" className="w-full" size={16}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Key</Text>
            <Input 
              placeholder="e.g. X-API-Key" 
              variant="filled" 
              className="font-mono text-sm"
              value={apiKey.key}
              onChange={(e) => updateApiKey({ key: e.target.value })}
            />
          </div>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Value</Text>
            <Input.Password 
              placeholder="Enter API Key Value" 
              variant="filled" 
              className="font-mono text-sm"
              value={apiKey.value}
              onChange={(e) => updateApiKey({ value: e.target.value })}
            />
          </div>
        </Space>

        <Space orientation="vertical" className="w-full" size={16}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Add To</Text>
            <Select 
              value={apiKey.addTo} 
              onChange={(val) => updateApiKey({ addTo: val })}
              className="w-full" 
              variant="filled"
              options={[
                { value: 'header', label: 'HTTP Headers' },
                { value: 'query', label: 'Query Params' },
              ]}
            />
          </div>
          <div className="pt-5">
            <div className="p-3 bg-secondary/30 rounded border border-border">
              <Text type="secondary" className="text-[11px] leading-relaxed">
                The key-value pair will be automatically injected into your request 
                <Text strong className="text-[11px]"> {apiKey.addTo === 'header' ? 'headers' : 'as a URL query parameter'}</Text>.
              </Text>
            </div>
          </div>
        </Space>
      </div>
    </div>
  );
}