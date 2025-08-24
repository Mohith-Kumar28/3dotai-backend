export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  access_token_expire_in: number;
  refresh_token_expire_in: number;
  open_id: string;
  seller_name: string;
  seller_base_region: string;
  user_type: number;
  granted_scopes: string[];
}

export interface TikTokShopInfo {
  id: string; // '7494105515082810525'
  name: string; // 'SANDBOX7541698533691705110'
  region: string; // 'GB'
  code: string; // 'GBLCTXQHN6'
  cipher: string; // 'GCP_sz2-9AAAAAC5i0xXesBU5U8f6-b0Wd5_'
  seller_type: string; // 'LOCAL'
}

export interface TikTokApiError {
  code: number;
  message: string;
  request_id: string;
}

export interface TikTokApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  request_id: string;
}

export interface TikTokRefreshTokenRequest {
  app_key: string;
  app_secret: string;
  refresh_token: string;
  grant_type: 'refresh_token';
}

export interface TikTokAuthState {
  userId: string;
  timestamp: number;
  nonce: string;
}
