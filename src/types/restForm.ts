export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface KeyValuePair {
  uiId: string;
  id: number | null;
  key: string | null;
  value: string | null;
  enabled: boolean;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type RestFromTabs = "Params" | "Headers" | "Body" | "Auth";
export type AuthType = 'none' | 'basic' | 'bearer' | 'jwt' | 'apikey' | 'oauth2';