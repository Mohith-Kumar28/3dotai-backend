export interface TikTokConfig {
  clientId: string;
  clientSecret: string;
  // Base URLs only - endpoints will be constructed in the client
  apiBaseUrl: string; // For API calls
  authBaseUrl: string; // For auth endpoints
  oauthBaseUrl: string; // For OAuth flow
  apiVersion: string;
}
