import { AuthGuard } from '@/auth/auth.guard';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  RefreshTokenDto,
  TikTokAuthCallbackDto,
  TikTokAuthResponseDto,
  TikTokAuthStatusDto,
  TikTokShopInfoDto,
} from './dto/tiktok-auth.dto';
import { TikTokService } from './tiktok.service';

@ApiTags('tiktok')
@Controller({
  path: 'tiktok',
  version: '1',
})
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TikTokController {
  constructor(private readonly tiktokService: TikTokService) {}

  @ApiAuth({
    summary: 'Initiate TikTok Shop authorization',
    description: 'Generate authorization URL for TikTok Shop OAuth flow',
    type: TikTokAuthResponseDto,
  })
  @Get('auth/initiate')
  async initiateAuth(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<TikTokAuthResponseDto> {
    const result = await this.tiktokService.initiateAuth(user.id);

    return {
      authUrl: result.authUrl,
      state: result.state,
    };
  }

  @ApiAuth({
    summary: 'Handle TikTok Shop OAuth callback',
    description: 'Process the OAuth callback and exchange code for tokens',
    type: TikTokShopInfoDto,
  })
  @Post('auth/callback')
  async handleCallback(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
    @Body() dto: TikTokAuthCallbackDto,
  ): Promise<TikTokShopInfoDto> {
    return this.tiktokService.handleCallback(user.id, dto);
  }

  @ApiAuth({
    summary: 'Get connected TikTok Shop information',
    description: 'Retrieve information about the users connected TikTok Shop',
    type: TikTokShopInfoDto,
    errorResponses: [404],
  })
  @Get('shop/info')
  async getShopInfo(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<TikTokShopInfoDto | null> {
    return this.tiktokService.getUserShopInfo(user.id);
  }

  @ApiAuth({
    summary: 'Disconnect TikTok Shop',
    description: 'Remove the connection between user account and TikTok Shop',
    errorResponses: [404],
  })
  @Delete('shop/disconnect')
  async disconnectShop(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<{ message: string; statusCode: number }> {
    await this.tiktokService.disconnectShop(user.id);
    return {
      message: 'TikTok Shop disconnected successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @ApiAuth({
    summary: 'Refresh TikTok Shop access token',
    description:
      'Manually refresh the access token for the connected TikTok Shop',
    type: RefreshTokenDto,
    errorResponses: [404],
  })
  @Post('auth/refresh')
  async refreshToken(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<RefreshTokenDto> {
    await this.tiktokService.refreshUserToken(user.id);
    return {
      success: true,
      message: 'Token refreshed successfully',
    };
  }

  @ApiAuth({
    summary: 'Get authorization status',
    description: 'Check if user has an active TikTok Shop connection',
    type: TikTokAuthStatusDto,
  })
  @Get('auth/status')
  async getAuthStatus(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<TikTokAuthStatusDto> {
    const shopInfo = await this.tiktokService.getUserShopInfo(user.id);

    if (!shopInfo) {
      return {
        isConnected: false,
      };
    }

    return {
      isConnected: true,
      shopId: shopInfo.shopId,
      shopName: shopInfo.shopName,
    };
  }
}
