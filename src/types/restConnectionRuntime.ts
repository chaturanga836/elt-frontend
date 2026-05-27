/** Capability keys — match backend services/rest_connection_runtime.py */

export const REST_CAP = {
  GET_VARIABLE: 'get_variable',
  SET_VARIABLE: 'set_variable',
  GET_AUTH_FIELD: 'get_auth_field',
  SET_AUTH_FIELD: 'set_auth_field',
  REFRESH_TOKEN: 'refresh_token',
  GET_SESSION: 'get_session',
  VALIDATE_AUTH: 'validate_auth',
} as const;

export type RestCapability = (typeof REST_CAP)[keyof typeof REST_CAP];

export interface AuthCapabilityCatalogEntry {
  auth_type: number;
  label: string;
  capabilities: RestCapability[];
  auth_config_fields: string[];
}

export interface RestConnectionPipelineObject {
  type: 'rest_connection';
  connection_id?: number;
  name?: string;
  auth_type: number;
  capabilities: RestCapability[];
  auth_config_fields: string[];
  effective: Record<string, unknown>;
}

/** Pre-request actions stored on pipeline node_config.runtime_actions */
export interface RestNodeRuntimeActions {
  set_variables?: Record<string, string>;
  set_auth_fields?: Record<string, string>;
  refresh_token?: boolean;
}
