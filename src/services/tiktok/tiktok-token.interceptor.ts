import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

export const TIKTOK_TOKEN_REQUIRED = 'tiktok_token_required';

/**
 * Decorator to mark endpoints that require TikTok access token
 */
export const RequiresTikTokToken = () =>
  Reflect.metadata(TIKTOK_TOKEN_REQUIRED, true);

@Injectable()
export class TikTokTokenInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requiresToken = this.reflector.getAllAndOverride<boolean>(
      TIKTOK_TOKEN_REQUIRED,
      [context.getHandler(), context.getClass()],
    );

    if (requiresToken) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user?.tiktokAccessToken) {
        throw new UnauthorizedException(
          'TikTok access token is required for this operation',
        );
      }
    }

    return next.handle();
  }
}
