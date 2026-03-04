'use client';

import { Input, Typography } from 'antd';
import { useConnectionStore } from '@/store/useConnectionStore';

const { Text } = Typography;

export default function BearerToken() {
  // 1. Connect to the specific bearer state and action
  const bearerAuth = useConnectionStore((state) => state.bearerTokenAuth);
  const updateBearerAuth = useConnectionStore((state) => state.updateBareTokenAuth);

  return (
    <div className="max-w-md space-y-4 animate-in fade-in duration-300">
      <div>
        <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
          Token
        </Text>
        <Input.Password 
          placeholder="Enter Bearer Token" 
          variant="filled" 
          className="font-mono text-sm" 
          value={bearerAuth.token}
          onChange={(e) => updateBearerAuth({ token: e.target.value })}
        />
        <Text type="secondary" className="text-[10px] mt-2 block italic opacity-70">
          Note: This token will be sent in the <Text code>Authorization</Text> header as 
          <Text className="font-mono text-[10px] ml-1">Bearer &lt;token&gt;</Text>
        </Text>
      </div>
    </div>
  );
}