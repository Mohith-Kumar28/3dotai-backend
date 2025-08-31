import { registerAs } from '@nestjs/config';
import { TikTokConfig } from './tiktok-config.type';

export default registerAs(
  'tiktok',
  (): TikTokConfig => ({
    clientId: process.env.TIKTOK_CLIENT_ID || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    // redirectUri: process.env.TIKTOK_REDIRECT_URI || '',
    baseUrl:
      process.env.TIKTOK_BASE_URL || 'https://open-api.tiktokglobalshop.com',
    authUrl:
      process.env.TIKTOK_AUTH_URL ||
      'https://services.us.tiktokshop.com/open/authorize?service_id=7528600490319742725',
    tokenUrl:
      process.env.TIKTOK_TOKEN_URL ||
      'https://auth.tiktok-shops.com/api/v2/token/get',
    tokenRefreshUrl:
      process.env.TIKTOK_TOKEN_REFRESH_URL ||
      'https://auth.tiktok-shops.com/api/v2/token/refresh',
    apiVersion: process.env.TIKTOK_API_VERSION || 'v2',
  }),
);
