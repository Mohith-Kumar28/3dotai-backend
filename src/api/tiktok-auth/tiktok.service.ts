import { GlobalConfig } from '@/config/config.type';
import { TikTokConfig } from '@/config/tiktok/tiktok-config.type';
import { TikTokApiClientService } from '@/services/tiktok/tiktok-api-client.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  TikTokAuthCallbackDto,
  TikTokShopInfoDto,
} from './dto/tiktok-auth.dto';
import {
  CreateTikTokAuthData,
  ITikTokAuthRepository,
  TIKTOK_AUTH_REPOSITORY,
} from './repositories/tiktok-auth.repository.interface';
import { TikTokAuthState } from './types/tiktok.types';

@Injectable()
export class TikTokService {
  private readonly tiktokConfig: TikTokConfig;

  constructor(
    private readonly configService: ConfigService<GlobalConfig>,
    private readonly tiktokApiClient: TikTokApiClientService,
    @Inject(TIKTOK_AUTH_REPOSITORY)
    private readonly tiktokAuthRepository: ITikTokAuthRepository,
  ) {
    this.tiktokConfig = this.configService.getOrThrow('tiktok', {
      infer: true,
    });
  }

  /**
   * Generate authorization URL for TikTok Shop OAuth flow
   */
  async initiateAuth(
    userId: string,
  ): Promise<{ authUrl: string; state: string }> {
    // Check if user already has an active TikTok Shop connection
    const existingAuth = await this.tiktokAuthRepository.findByUserId(userId);
    if (existingAuth && existingAuth.isActive) {
      throw new BadRequestException(
        'User already has an active TikTok Shop connection',
      );
    }

    // Generate state for CSRF protection
    const state = this.generateState(userId);

    // Get authorization URL from client
    const authUrl = this.tiktokApiClient.getAuthorizationUrl();

    return { authUrl, state };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    userId: string,
    dto: TikTokAuthCallbackDto,
  ): Promise<TikTokShopInfoDto> {
    // Verify state parameter
    if (dto.state) {
      const isValidState = this.verifyState(dto.state, userId);
      if (!isValidState) {
        throw new UnauthorizedException('Invalid state parameter');
      }
    }

    // Exchange authorization code for tokens using client
    const tokenResponse = await this.tiktokApiClient.exchangeCodeForTokens(
      dto.code,
    );

    // Get shop information using client
    const shopInfo = await this.tiktokApiClient.getShopInfo(
      tokenResponse.access_token,
    );

    // Calculate expiration dates
    const accessTokenExpiresAt = new Date(
      Date.now() + tokenResponse.access_token_expire_in * 1000,
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + tokenResponse.refresh_token_expire_in * 1000,
    );

    // Save auth data
    const authData: CreateTikTokAuthData = {
      userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      shopId: shopInfo.id,
      shopName: shopInfo.name,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      scope: tokenResponse.granted_scopes,
      region: shopInfo.region,
    };

    const existingAuth = await this.tiktokAuthRepository.findByUserId(userId);

    if (existingAuth) {
      await this.tiktokAuthRepository.update(userId, authData);
    } else {
      await this.tiktokAuthRepository.create(authData);
    }

    return {
      shopId: shopInfo.id,
      shopName: shopInfo.name,
      region: shopInfo.region,
      isActive: true,
      createdAt: existingAuth?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get user's TikTok Shop information
   */
  async getUserShopInfo(userId: string): Promise<TikTokShopInfoDto | null> {
    const auth = await this.tiktokAuthRepository.findByUserId(userId);
    if (!auth || !auth.isActive) {
      return null;
    }

    return {
      shopId: auth.shopId,
      shopName: auth.shopName,
      region: auth.region,
      isActive: auth.isActive,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    };
  }

  /**
   * Disconnect TikTok Shop from user account
   */
  async disconnectShop(userId: string): Promise<void> {
    const auth = await this.tiktokAuthRepository.findByUserId(userId);
    if (!auth) {
      throw new NotFoundException('No TikTok Shop connection found');
    }

    await this.tiktokAuthRepository.delete(userId);
  }

  /**
   * Refresh access token for a user
   */
  async refreshUserToken(userId: string): Promise<void> {
    const auth = await this.tiktokAuthRepository.findByUserId(userId);
    if (!auth) {
      throw new NotFoundException('No TikTok Shop connection found');
    }

    await this.refreshAccessTokenInternal(auth.refreshToken, userId);
  }

  /**
   * Get valid access token for user (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const auth = await this.tiktokAuthRepository.findByUserId(userId);
    if (!auth || !auth.isActive) {
      throw new NotFoundException('No active TikTok Shop connection found');
    }

    // Check if token is expired or about to expire (5 minutes buffer)
    const now = new Date();
    const expiryBuffer = new Date(
      auth.accessTokenExpiresAt.getTime() - 5 * 60 * 1000,
    );

    if (now >= expiryBuffer) {
      await this.refreshAccessTokenInternal(auth.refreshToken, userId);
      const updatedAuth = await this.tiktokAuthRepository.findByUserId(userId);
      return updatedAuth!.accessToken;
    }

    return auth.accessToken;
  }

  /**
   * Generate state parameter for OAuth flow
   */
  private generateState(userId: string): string {
    const authState: TikTokAuthState = {
      userId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const stateString = JSON.stringify(authState);
    return Buffer.from(stateString).toString('base64url');
  }

  /**
   * Verify state parameter
   */
  private verifyState(state: string, expectedUserId: string): boolean {
    try {
      const stateString = Buffer.from(state, 'base64url').toString();
      const authState: TikTokAuthState = JSON.parse(stateString);

      // Check if state is for the correct user
      if (authState.userId !== expectedUserId) {
        return false;
      }

      // Check if state is not too old (5 minutes)
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - authState.timestamp > maxAge) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessTokenInternal(
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    try {
      const tokenData =
        await this.tiktokApiClient.refreshAccessToken(refreshToken);

      const accessTokenExpiresAt = new Date(
        Date.now() + tokenData.access_token_expire_in * 1000,
      );
      const refreshTokenExpiresAt = new Date(
        Date.now() + tokenData.refresh_token_expire_in * 1000,
      );

      await this.tiktokAuthRepository.update(userId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to refresh token: ${error.message}`,
      );
    }
  }
}
