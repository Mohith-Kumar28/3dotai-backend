import { registerAs } from '@nestjs/config';
import { TikTokConfig } from './tiktok-config.type';

export default registerAs(
  'tiktok',
  (): TikTokConfig => ({
    clientId: process.env.TIKTOK_CLIENT_ID || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    // Base URLs only - specific endpoints constructed in client
    apiBaseUrl:
      process.env.TIKTOK_API_BASE_URL ||
      'https://open-api.tiktokglobalshop.com',
    authBaseUrl:
      process.env.TIKTOK_AUTH_BASE_URL ||
      'https://auth.tiktok-shops.com/api/v2',
    oauthBaseUrl:
      process.env.TIKTOK_OAUTH_BASE_URL ||
      'https://services.us.tiktokshop.com/open/authorize?service_id=7528600490319742725',
    apiVersion: process.env.TIKTOK_API_VERSION || 'v2',
  }),
);
