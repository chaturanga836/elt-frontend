// src/types/connection.ts

import { KeyValuePair } from "./restForm";

export interface ConnectionCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface ConnectionPrototype {
  id: string;
  name: string;
  ui_type: 'form' | 'wizard';
  category_id: string;
}

export interface ConnectionSchema {
  fields: any[]; 
  validation: any;
}

// auth types
export interface IBasicAuth {
  username: string;
  password: string;
}

export interface IBearerToken {
  token: string;
}

export interface IJWTBearer {
  alg: string;
  secret: string;
  isBase64: boolean;
  payload: string;
  prefix: string;
  addTo: 'header' | 'query';
  queryParamName: string;
  jwtHeaders: any[]; // KeyValuePairs
}

export interface IOAuth2 {
  tokenName: string;
  grantType: string;
  callbackUrl: string;
  authUrl: string;
  accessTokenUrl: string;
  authMethod: 'client_secret_post' | 'basic_auth' | 'client_credentials_body';
  clientId: string;
  clientSecret: string;
  scope: string;
  state: string;
  refreshTokenUrl: string;
  authRequestParams: any[];
  tokenRequestParams: any[];
  refreshRequestParams: any[];
}

export interface IApiKey {
  key: string;
  value: string;
  addTo: 'header' | 'query';
}

// body types
export type BodyType = 'none' | 'form-data' | 'json' | 'xml' | 'graphQL';

export interface IFormData {
  pairs: KeyValuePair[];
}

export interface IRawBody {
  content: string;
}

export interface IGraphQL {
  query: string;
  variables: string; // JSON string for variables
}

export interface IRequestBodyState {
  activeType: BodyType;
  bodyData: IFormData | IRawBody | IGraphQL | null;
}