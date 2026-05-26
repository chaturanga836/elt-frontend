'use client';

import React from 'react';
import { Alert, Select, Typography, Divider } from 'antd';
import BasicAuth from './BasicAuth';
import BearerToken from './BearerToken';
import JWTBearer from './JWTBearer';
import OAuth2 from './OAuth2';
import ApiKeyAuth from './ApiKeyAuth';
import NoneAuth from './NoneAuth';
import { useConnectionStore } from '@/store/useConnectionStore';
import { AuthType } from '@/types/restForm';

const { Text } = Typography;

const authOptions = [
  { value: 'none', label: 'No Authentication' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'jwt', label: 'JWT Bearer' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'apikey', label: 'API Key' },
];

const AUTH_TYPE_LABELS: Record<number, string> = {
  0: 'None', 1: 'Basic Auth', 2: 'Bearer Token',
  3: 'JWT Bearer', 4: 'API Key', 5: 'OAuth 2.0',
};

export default function RequestAuth() {
  const authType = useConnectionStore((state) => state.authType);
  const setAuthType = useConnectionStore((state) => state.setAuthType);
  const groupId = useConnectionStore((state) => state.groupId);
  const groupAuthType = useConnectionStore((state) => state.groupAuthType);

  const renderAuthComponent = () => {
    switch (authType) {
      case 'basic': return <BasicAuth />;
      case 'bearer': return <BearerToken />;
      case 'jwt': return <JWTBearer />;
      case 'oauth2': return <OAuth2 />;
      case 'apikey': return <ApiKeyAuth />;
      default: return <NoneAuth />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {groupId && groupAuthType > 0 && (
        <Alert
          type="info"
          showIcon
          title={`Group auth: ${AUTH_TYPE_LABELS[groupAuthType] || 'Unknown'}`}
          description={
            authType === 'none'
              ? "This endpoint inherits the group's authentication. Select a different type below to override."
              : "You are overriding the group's auth for this endpoint."
          }
          className="mb-0"
        />
      )}

      <div className="flex items-center gap-4">
        <div className="w-1/3">
          <Text strong className="text-[11px] text-muted-foreground uppercase block mb-1">
            Auth Type
          </Text>
          <Select
            value={authType}
            onChange={(value) => setAuthType(value as AuthType)}
            options={
              groupId && groupAuthType > 0
                ? [{ value: 'none', label: `Inherit from Group (${AUTH_TYPE_LABELS[groupAuthType]})` }, ...authOptions.slice(1)]
                : authOptions
            }
            className="w-full"
            variant="filled"
          />
        </div>
        <div className="flex-1 pt-5">
           <Text type="secondary" className="text-xs italic">
             {authType === 'none' && groupId && groupAuthType > 0
               ? "Using group-level authentication automatically."
               : "Selected method will be applied to headers/params during execution."}
           </Text>
        </div>
      </div>

      <Divider className="my-0" />

      <div className="min-h-50 animate-in fade-in slide-in-from-top-1 duration-300">
        {renderAuthComponent()}
      </div>
    </div>
  );
}