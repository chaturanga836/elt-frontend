'use client';

import React, { useState } from 'react';
import { Input, Select, Radio, Typography, Divider, Space, Button, Collapse } from 'antd';
import { PlayCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import KeyValueTable from '../KeyValueTable';
import { useConnectionStore } from '@/store/useConnectionStore';

const { Text } = Typography;

export default function OAuth2() {

  const [authMethod, setAuthMethod] = useState('client_secret_post');

  const oauth2 = useConnectionStore((state) => state.oauth2Auth);
  const updateOAuth2 = useConnectionStore((state) => state.updateOAuth2Auth);
  const variables = useConnectionStore((state) => state.variables);
  
  const advancedItems = [
    {
      key: '1',
      label: (
        <span className="text-[11px] font-bold uppercase text-primary flex items-center gap-2">
          <ShieldCheck size={14}/> Advanced Request Customization
        </span>
      ),
      children: (
        <div className="space-y-6 pt-2">
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Auth Request Params</Text>
            <KeyValueTable 
            initialPairs={oauth2.authRequestParams} 
            onChange={(pairs) => updateOAuth2({ authRequestParams: pairs })}
            keyPlaceholder="Key" 
            valuePlaceholder="Value" 
             globalVariables={variables}/>
          </div>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Token Request Params</Text>
            <KeyValueTable 
            initialPairs={oauth2.tokenRequestParams} 
            onChange={(pairs) => updateOAuth2({ tokenRequestParams: pairs })}
            keyPlaceholder="Key" 
            valuePlaceholder="Value" 
            globalVariables={variables}/>
          </div>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Refresh Request Params</Text>
            <KeyValueTable 
            initialPairs={oauth2.refreshRequestParams} 
            onChange={(pairs) => updateOAuth2({ refreshRequestParams: pairs })}
            keyPlaceholder="Key" 
            valuePlaceholder="Value" 
            globalVariables={variables}/>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* 1. TOP LEVEL CONFIG */}
      <div className="grid grid-cols-2 gap-8">
        <Space orientation="vertical" className="w-full" size={16}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Token Name</Text>
            <Input value={oauth2.tokenName} onChange={(e) => updateOAuth2({ tokenName: e.target.value })} placeholder="e.g. Google Auth Token" variant="filled" className="text-sm" />
          </div>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Grant Type</Text>
            <Select 
              value={oauth2.grantType}
              onChange={(val) => updateOAuth2({ grantType: val })}
              className="w-full" 
              variant="filled"
              options={[
                { value: 'authorization_code', label: 'Authorization Code' },
                { value: 'pkce', label: 'Auth Code with PKCE' },
                { value: 'implicit', label: 'Implicit' },
                { value: 'password', label: 'Password Credentials' },
                { value: 'client_credentials', label: 'Client Credentials' },
              ]}
            />
          </div>
        </Space>

        <Space orientation="vertical" className="w-full" size={16}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Callback URL</Text>
            <Input defaultValue="https://oauth.pstmn.io/v1/callback"
            value={oauth2.callbackUrl}
            onChange={(e) => updateOAuth2({ callbackUrl: e.target.value })}
             variant="filled" className="font-mono text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Scope</Text>
               <Input placeholder="openid email profile" 
               value={oauth2.scope}
               onChange={(e) => updateOAuth2({ scope: e.target.value })}
               variant="filled" className="text-xs" />
            </div>
            <div>
               <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">State</Text>
               <Input placeholder="random_string" 
               value={oauth2.state} 
               onChange={(e) => updateOAuth2({ state: e.target.value })} variant="filled" className="text-xs" />
            </div>
          </div>
        </Space>
      </div>

      <Divider className="my-2" />

      {/* 2. ENDPOINT CONFIGURATION */}
      <div className="grid grid-cols-2 gap-8">
        <Space orientation="vertical" className="w-full" size={12}>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Auth URL</Text>
            <Input placeholder="https://example.com/oauth2/authorize" variant="filled" className="font-mono text-xs" />
          </div>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Access Token URL</Text>
            <Input placeholder="https://example.com/oauth2/token" variant="filled" className="font-mono text-xs" />
          </div>
          <div>
            <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Refresh Token URL</Text>
            <Input placeholder="Optional" variant="filled" className="font-mono text-xs" />
          </div>
        </Space>

        {/* 3. CLIENT AUTH METHOD */}
        <div className="bg-secondary/10 p-4 rounded-lg border border-border">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-3 block">Client Authentication</Text>
          <Radio.Group 
            value={authMethod} 
            onChange={(e) => setAuthMethod(e.target.value)}
            className="flex flex-col gap-3"
          >
            <Radio value="client_secret_post" className="text-xs font-medium">
              1. Send Client ID & Secret in Body
            </Radio>
            <Radio value="basic_auth" className="text-xs font-medium">
              2. Send Basic Auth Header
            </Radio>
            <Radio value="client_credentials_body" className="text-xs font-medium">
              3. Send Credentials in Body (Custom)
            </Radio>
          </Radio.Group>

          <div className="mt-4 space-y-3">
            <Input placeholder="Client ID" variant="filled" className="font-mono text-xs" />
            <Input.Password placeholder="Client Secret" variant="filled" className="font-mono text-xs" />
          </div>
        </div>
      </div>

      {/* 4. ADVANCED REQUEST CUSTOMIZATION */}
      <Collapse ghost items={advancedItems} className="border border-border rounded-lg bg-card mt-4" />
 

      {/* 5. ACTION BUTTON */}
      <div className="pt-4 flex justify-end">
        <Button 
          type="primary" 
          icon={<PlayCircle size={16} />} 
          className="bg-blue-600 hover:bg-blue-700 h-10 px-8 font-bold flex items-center gap-2"
        >
          Get New Access Token
        </Button>
      </div>
    </div>
  );
}