import { generateSign } from '@/common/utils/tiktok-signature.util';
import { GlobalConfig } from '@/config/config.type';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface TikTokApiRequestConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: Record<string, any>;
  requiresAuth?: boolean;
  requiresSignature?: boolean;
}

export interface TikTokApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

@Injectable()
export class TikTokApiClientService {
  private readonly logger = new Logger(TikTokApiClientService.name);
  private readonly tiktokConfig;

  constructor(private readonly configService: ConfigService<GlobalConfig>) {
    this.tiktokConfig = this.configService.getOrThrow('tiktok', {
      infer: true,
    });
  }

  /**
   * Make authenticated API call with automatic signature generation
   */
  async makeApiCall<T = any>(
    config: TikTokApiRequestConfig,
    accessToken?: string,
  ): Promise<T> {
    const {
      endpoint,
      method = 'GET',
      params = {},
      data,
      requiresAuth = true,
      requiresSignature = true,
    } = config;

    // Validate access token if required
    if (requiresAuth && !accessToken) {
      throw new UnauthorizedException(
        'Access token is required for this API call',
      );
    }

    // Build full URL
    const fullUrl = `${this.tiktokConfig.apiBaseUrl}${endpoint}`;

    // Prepare base parameters
    const requestParams: Record<string, any> = {
      app_key: this.tiktokConfig.clientId,
      ...params,
    };

    // Add timestamp for signature generation
    if (requiresSignature) {
      requestParams.timestamp = Math.floor(Date.now() / 1000).toString();
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth && accessToken) {
      headers['x-tts-access-token'] = accessToken;
    }

    // Generate signature if required
    if (requiresSignature) {
      const requestConfig = {
        url: fullUrl,
        params: requestParams,
        headers,
        data,
      };

      const signature = generateSign(
        requestConfig,
        this.tiktokConfig.clientSecret,
      );
      requestParams.sign = signature;
    }

    try {
      const axiosConfig: AxiosRequestConfig = {
        method,
        url: fullUrl,
        params: requestParams,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        axiosConfig.data = data;
      }

      this.logger.debug(`Making TikTok API call: ${method} ${fullUrl}`);

      const response: AxiosResponse<TikTokApiResponse<T>> =
        await axios(axiosConfig);

      // Check TikTok API response code
      if (response.data.code !== 0) {
        this.logger.error(`TikTok API error: ${response.data.message}`, {
          code: response.data.code,
          endpoint,
          requestId: response.data.request_id,
        });
        throw new BadRequestException(
          `TikTok API error: ${response.data.message} (Code: ${response.data.code})`,
        );
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`TikTok API request failed: ${error.message}`, {
          endpoint,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        throw new BadRequestException(
          `TikTok API request failed: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Make authentication-related API call (token exchange, refresh)
   */
  async makeAuthCall<T = any>(
    endpoint: string,
    params: Record<string, any>,
  ): Promise<T> {
    const fullUrl = `${this.tiktokConfig.authBaseUrl}${endpoint}`;

    try {
      this.logger.debug(`Making TikTok Auth API call: GET ${fullUrl}`);

      const response: AxiosResponse<TikTokApiResponse<T>> = await axios.get(
        fullUrl,
        {
          params: {
            app_key: this.tiktokConfig.clientId,
            app_secret: this.tiktokConfig.clientSecret,
            ...params,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.code !== 0) {
        this.logger.error(`TikTok Auth API error: ${response.data.message}`, {
          code: response.data.code,
          endpoint,
        });
        throw new BadRequestException(
          `TikTok Auth API error: ${response.data.message} (Code: ${response.data.code})`,
        );
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`TikTok Auth API request failed: ${error.message}`, {
          endpoint,
          status: error.response?.status,
        });
        throw new BadRequestException(
          `TikTok Auth API request failed: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    return this.tiktokConfig.oauthBaseUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    return this.makeAuthCall('/token/get', {
      auth_code: code,
      grant_type: 'authorized_code',
    });
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    return this.makeAuthCall('/token/refresh', {
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  }

  /**
   * Get shop information
   */
  async getShopInfo(accessToken: string) {
    const result = await this.makeApiCall<{ shops: any[] }>(
      {
        endpoint: '/authorization/202309/shops',
        requiresAuth: true,
        requiresSignature: true,
      },
      accessToken,
    );

    if (!result.shops || result.shops.length === 0) {
      throw new BadRequestException('No authorized shops found');
    }

    return result.shops[0];
  }

  /**
   * Generic method for creator search APIs (future use)
   */
  async searchCreators(accessToken: string, searchParams: Record<string, any>) {
    return this.makeApiCall(
      {
        endpoint: '/creators/search', // Example endpoint
        params: searchParams,
        requiresAuth: true,
        requiresSignature: true,
      },
      accessToken,
    );
  }

  /**
   * Generic method for bot APIs (future use)
   */
  async makeBotApiCall(
    accessToken: string,
    endpoint: string,
    params?: Record<string, any>,
  ) {
    return this.makeApiCall(
      {
        endpoint,
        params,
        requiresAuth: true,
        requiresSignature: true,
      },
      accessToken,
    );
  }

  /**
   * Get products (example for future API)
   */
  async getProducts(accessToken: string, filters?: Record<string, any>) {
    return this.makeApiCall(
      {
        endpoint: '/products',
        params: filters,
        requiresAuth: true,
        requiresSignature: true,
      },
      accessToken,
    );
  }

  /**
   * Create product (example for future API)
   */
  async createProduct(accessToken: string, productData: Record<string, any>) {
    return this.makeApiCall(
      {
        endpoint: '/products',
        method: 'POST',
        data: productData,
        requiresAuth: true,
        requiresSignature: true,
      },
      accessToken,
    );
  }
}
