import { Form, Input, Select, Space } from 'antd';

export const AUTH_OPTIONS = [
  { value: 0, label: 'No Authentication' },
  { value: 1, label: 'Basic Auth' },
  { value: 2, label: 'Bearer Token' },
  { value: 3, label: 'JWT Bearer' },
  { value: 4, label: 'API Key' },
  { value: 5, label: 'OAuth 2.0' },
];

export const AUTH_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Basic Auth',
  2: 'Bearer Token',
  3: 'JWT Bearer',
  4: 'API Key',
  5: 'OAuth 2.0',
};

export function buildAuthConfig(
  authType: number,
  values: Record<string, unknown>,
) {
  switch (authType) {
    case 1:
      return { username: values.auth_username || '', password: values.auth_password || '' };
    case 2:
      return { token: values.auth_token || '' };
    case 3:
      return { token: values.auth_jwt_token || '' };
    case 4:
      return {
        key: values.auth_apikey_key || '',
        value: values.auth_apikey_value || '',
        addTo: values.auth_apikey_addto || 'header',
      };
    case 5:
      return {
        client_id: values.auth_client_id || '',
        client_secret: values.auth_client_secret || '',
        token_url: values.auth_token_url || '',
      };
    default:
      return {};
  }
}

interface AuthFieldsProps {
  authType: number;
  onAuthTypeChange: (value: number) => void;
}

export default function AuthFields({ authType, onAuthTypeChange }: AuthFieldsProps) {
  return (
    <>
      <Form.Item label="Auth Type">
        <Select
          value={authType}
          onChange={onAuthTypeChange}
          options={AUTH_OPTIONS}
        />
      </Form.Item>

      {authType === 1 && (
        <Space.Compact className="w-full">
          <Form.Item
            name="auth_username"
            className="flex-1 mb-3"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="auth_password"
            className="flex-1 mb-3"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
        </Space.Compact>
      )}

      {authType === 2 && (
        <Form.Item
          name="auth_token"
          label="Token"
          rules={[{ required: true, message: 'Bearer token is required' }]}
        >
          <Input.Password placeholder="Bearer token" />
        </Form.Item>
      )}

      {authType === 3 && (
        <Form.Item
          name="auth_jwt_token"
          label="JWT Token"
          rules={[{ required: true, message: 'JWT token is required' }]}
        >
          <Input.Password placeholder="JWT token or secret" />
        </Form.Item>
      )}

      {authType === 4 && (
        <>
          <Form.Item
            name="auth_apikey_key"
            label="Parameter Name"
            rules={[{ required: true, message: 'Parameter name is required' }]}
          >
            <Input placeholder="e.g. apikey, X-API-KEY" />
          </Form.Item>
          <Form.Item
            name="auth_apikey_value"
            label="API Key"
            rules={[{ required: true, message: 'API key value is required' }]}
          >
            <Input.Password placeholder="Your API key" />
          </Form.Item>
          <Form.Item name="auth_apikey_addto" label="Add to" initialValue="header">
            <Select
              options={[
                { value: 'header', label: 'Header' },
                { value: 'query', label: 'Query Parameter' },
              ]}
            />
          </Form.Item>
        </>
      )}

      {authType === 5 && (
        <>
          <Form.Item
            name="auth_client_id"
            label="Client ID"
            rules={[{ required: true, message: 'Client ID is required' }]}
          >
            <Input placeholder="Client ID" />
          </Form.Item>
          <Form.Item
            name="auth_client_secret"
            label="Client Secret"
            rules={[{ required: true, message: 'Client Secret is required' }]}
          >
            <Input.Password placeholder="Client Secret" />
          </Form.Item>
          <Form.Item
            name="auth_token_url"
            label="Token URL"
            rules={[{ required: true, message: 'Token URL is required' }]}
          >
            <Input placeholder="https://auth.example.com/oauth/token" />
          </Form.Item>
        </>
      )}
    </>
  );
}
