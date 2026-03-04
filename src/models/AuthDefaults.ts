import { IApiKey, IBasicAuth, IBearerToken, IJWTBearer, IOAuth2 } from "@/types/connection";
import { KeyValuePair } from "@/types/restForm";


export class BasicAuthDefaults implements IBasicAuth {
  username = '';
  password = '';
}

export class BearerTokenDefaults implements IBearerToken {
  token = '';
}

export class JWTBearerDefaults implements IJWTBearer {
  alg = 'HS256';
  secret = '';
  isBase64 = false;
  payload = '';
  prefix = 'Bearer';
  addTo: 'header' | 'query' = 'header';
  queryParamName = 'token';
  jwtHeaders: KeyValuePair[] = [];
}

export class ApiKeyDefaults implements IApiKey {
  key = '';
  value = '';
  addTo: 'header' | 'query' = 'header';
}

export class OAuth2Defaults implements IOAuth2 {
  tokenName = '';
  grantType = 'authorization_code';
  callbackUrl = '';
  authUrl = '';
  accessTokenUrl = '';
  authMethod: 'client_secret_post' | 'basic_auth' | 'client_credentials_body' = 'client_secret_post';
  clientId = '';
  clientSecret = '';
  scope = '';
  state = '';
  refreshTokenUrl = '';
  authRequestParams : KeyValuePair[] = [];
  tokenRequestParams : KeyValuePair[] = [];
  refreshRequestParams : KeyValuePair[] = [];
}