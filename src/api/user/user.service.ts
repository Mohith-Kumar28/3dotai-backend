import { BetterAuthService } from '@/auth/better-auth.service';
import { Uuid } from '@/common/types/common.type';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { I18nTranslations } from '@/generated/i18n.generated';
import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  CursorPaginatedUserDto,
  OffsetPaginatedUserDto,
  QueryUsersCursorDto,
  QueryUsersOffsetDto,
  UserDto,
} from './dto/user.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from './repositories/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    private readonly i18nService: I18nService<I18nTranslations>,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly betterAuthService: BetterAuthService,
  ) {}

  async findAllUsers(
    dto: QueryUsersOffsetDto,
  ): Promise<OffsetPaginatedUserDto> {
    const { page = 1, limit = 10 } = dto;
    const result = await this.userRepository.findAll(page, limit);

    return new OffsetPaginatedUserDto(
      result.data.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        image: user.image || undefined,
        role: user.role,
        bio: user.bio || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      result.pagination,
    );
  }

  async findAllUsersCursor(
    reqDto: QueryUsersCursorDto,
  ): Promise<CursorPaginatedUserDto> {
    const { limit = 10, afterCursor, beforeCursor } = reqDto;
    const cursor = afterCursor || beforeCursor || undefined;
    const result = await this.userRepository.findAllCursor(cursor, limit);

    return new CursorPaginatedUserDto(
      result.data.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        image: user.image || undefined,
        role: user.role,
        bio: user.bio || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      result.pagination,
    );
  }

  async findOneUser(id: Uuid | string): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(this.i18nService.t('user.notFound'));
    }

    // Directly map the user to DTO
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      image: user.image || undefined,
      role: user.role,
      bio: user.bio || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async deleteUser(id: Uuid | string) {
    await this.userRepository.delete(id);
    return HttpStatus.OK;
  }

  async getAllUsers() {
    // Note: This method might need to be updated if pagination is needed
    // Currently, it will return all users which might not be efficient for large datasets
    const page = 1;
    const limit = 1000; // Arbitrary large number to get all users
    const result = await this.userRepository.findAll(page, limit);
    return result.data;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserProfileDto,
    _currentUser: CurrentUserSession, // Prefix with _ to indicate it's intentionally unused
  ): Promise<UserDto> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Update the user
    const updatedUser = await this.userRepository.update(id, {
      ...updateUserDto,
    });

    // Directly map the updated user to DTO
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName || undefined,
      lastName: updatedUser.lastName || undefined,
      image: updatedUser.image || undefined,
      role: updatedUser.role,
      bio: updatedUser.bio || undefined,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async updateUserProfile(
    userId: string,
    dto: UpdateUserProfileDto,
    options: { headers: CurrentUserSession['headers'] },
  ) {
    // Check if email is being updated and if it's already in use
    if (dto.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException(
          this.i18nService.t('auth.validation.emailAlreadyExists' as any),
        );
      }
    }

    // Prepare the update data
    const updateData: Record<string, any> = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
    };

    // Only update username if it's actually changing
    let shouldChangeUsername = !(dto.username == null);

    if (shouldChangeUsername) {
      const user = await this.userRepository.findById(userId);
      shouldChangeUsername = user?.username !== dto.username;
    }

    // Update the user in the authentication service if needed
    const authUpdate: Record<string, any> = {};

    if (dto.image !== undefined) {
      authUpdate.image = dto.image;
    }

    if (shouldChangeUsername && dto.username !== undefined) {
      authUpdate.username = dto.username;
    }

    // Only call the auth service if there are auth-related fields to update
    if (Object.keys(authUpdate).length > 0) {
      await this.betterAuthService.api.updateUser({
        body: authUpdate,
        headers: options?.headers as any,
      });
    }

    // Update the user in the database
    await this.userRepository.update(userId, updateData);
    return await this.findOneUser(userId);
  }
}
