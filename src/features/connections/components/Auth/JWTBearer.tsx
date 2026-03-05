'use client';

import React from 'react';
import { Input, Select, Checkbox, Typography, Divider, Space, Radio } from 'antd';
import { useConnectionStore } from '@/store/useConnectionStore';
import KeyValueTable from '../KeyValueTable';

const { Text } = Typography;
const { TextArea } = Input;

const algorithms = [
  "HS256", "HS384", "HS512", 
  "RS256", "RS384", "RS512", 
  "PS256", "PS384", "PS512", 
  "ES256", "ES384", "ES512"
];

export default function JWTBearer() {
  // 1. Store Connection
  const jwtAuth = useConnectionStore((state) => state.jwtBearerAuth);
  const updateJWTAuth = useConnectionStore((state) => state.updateJWTAuth);
const variables = useConnectionStore((state) => state.variables);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. CONFIGURATION SECTION */}
      <div className="grid grid-cols-2 gap-8">
        <Space orientation="vertical" className="w-full" size={16}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Algorithm</Text>
            <Select 
              value={jwtAuth.alg} 
              onChange={(val) => updateJWTAuth({ alg: val })}
              className="w-full font-mono" 
              variant="filled"
              options={algorithms.map(alg => ({ label: alg, value: alg }))}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Text className="text-[10px] font-bold text-muted-foreground uppercase">Secret / Private Key</Text>
              <Checkbox 
                checked={jwtAuth.isBase64}
                onChange={(e) => updateJWTAuth({ isBase64: e.target.checked })}
                className="text-[10px] text-muted-foreground"
              >
                Base64 Encoded
              </Checkbox>
            </div>
            <Input.Password 
              value={jwtAuth.secret}
              onChange={(e) => updateJWTAuth({ secret: e.target.value })}
              placeholder="Enter secret or paste private key" 
              variant="filled" 
              className="font-mono text-xs" 
            />
          </div>
        </Space>

        <Space orientation="vertical" className="w-full" size={16}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Add Token To</Text>
            <Radio.Group 
              value={jwtAuth.addTo} 
              onChange={(e) => updateJWTAuth({ addTo: e.target.value })}
              optionType="button"
              buttonStyle="solid"
              size="small"
              className="w-full flex"
            >
              <Radio.Button value="header" className="flex-1 text-center text-[11px]">Header</Radio.Button>
              <Radio.Button value="query" className="flex-1 text-center text-[11px]">Query Param</Radio.Button>
            </Radio.Group>
          </div>

          {jwtAuth.addTo === 'header' ? (
            <div className="animate-in zoom-in-95 duration-200">
              <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Request Header Prefix</Text>
              <Input 
                value={jwtAuth.prefix}
                onChange={(e) => updateJWTAuth({ prefix: e.target.value })}
                placeholder="Bearer" 
                variant="filled" 
                className="font-mono text-sm" 
              />
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-200">
              <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Query Parameter Name</Text>
              <Input 
                value={jwtAuth.queryParamName}
                onChange={(e) => updateJWTAuth({ queryParamName: e.target.value })}
                placeholder="e.g. access_token" 
                variant="filled" 
                className="font-mono text-sm" 
              />
            </div>
          )}
        </Space>
      </div>

      <Divider className="my-2" />

      {/* 2. DATA SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase block">Payload (JSON)</Text>
          <TextArea 
            value={jwtAuth.payload}
            onChange={(e) => updateJWTAuth({ payload: e.target.value })}
            rows={8} 
            placeholder='{ "sub": "123", "role": "admin" }' 
            variant="filled" 
            className="font-mono text-xs p-3" 
          />
        </div>

        <div className="space-y-2">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase block">JWT Headers (Jose)</Text>
          <div className="border border-border rounded-md overflow-hidden">
            <KeyValueTable 
               initialPairs={jwtAuth.jwtHeaders}
               onChange={(pairs) => updateJWTAuth({ jwtHeaders: pairs })}
               keyPlaceholder="Header Key" 
               valuePlaceholder="Value" 
               globalVariables={variables}
            />
          </div>
        </div>
      </div>
    </div>
  );
}