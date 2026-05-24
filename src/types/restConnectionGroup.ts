export interface IntegrationProvider {
  key: string;
  name: string;
  description: string;
  logo: string;
  default_base_url: string;
  default_auth_type: number;
  default_auth_hint: string;
  default_variables: { key: string; value: string; enabled: boolean }[];
}

export interface EndpointTemplate {
  template_key: string;
  name: string;
  method: number;
  path: string;
  description?: string;
  params?: { key: string; value: string; enabled: boolean }[];
}

export interface RestConnectionGroup {
  id: number;
  tenant_id: string;
  name: string;
  provider_key: string;
  description?: string;
  base_url: string;
  auth_type: number;
  auth_config: Record<string, unknown>;
  variables: unknown[];
  fetch_settings: Record<string, unknown>;
  endpoint_count: number;
}

export interface RestConnectionGroupDetail extends RestConnectionGroup {
  endpoints: Array<{
    id: number;
    name: string;
    path?: string;
    method: number;
    effective_url?: string;
    params?: unknown[];
  }>;
}
