'use client';

import React, { useState } from 'react';
import { Select, Typography, Divider } from 'antd';
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

export default function RequestAuth() {
  // 1. Use global state instead of local useState
  const authType = useConnectionStore((state) => state.authType);
  const setAuthType = useConnectionStore((state) => state.setAuthType);

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
      <div className="flex items-center gap-4">
        <div className="w-1/3">
          <Text strong className="text-[11px] text-muted-foreground uppercase block mb-1">
            Auth Type
          </Text>
          <Select
            value={authType}
            // 2. This now updates the global store
            onChange={(value) => setAuthType(value as AuthType)} 
            options={authOptions}
            className="w-full"
            variant="filled"
          />
        </div>
        <div className="flex-1 pt-5">
           <Text type="secondary" className="text-xs italic">
             Selected method will be applied to headers/params during execution.
           </Text>
        </div>
      </div>

      <Divider className="my-0" />

      {/* The animation remains, but content is now driven by global state */}
      <div className="min-h-50 animate-in fade-in slide-in-from-top-1 duration-300">
        {renderAuthComponent()}
      </div>
    </div>
  );
}