import { BetterAuthService } from '@/auth/better-auth.service';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from './repositories/user.repository.interface';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<IUserRepository>;
  let i18nService: jest.Mocked<I18nService>;
  let betterAuthService: jest.Mocked<BetterAuthService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    image: 'https://example.com/avatar.jpg',
    role: 'User',
    isEmailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    displayUsername: 'testuser',
    bio: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findAllCursor: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn(),
          },
        },
        {
          provide: BetterAuthService,
          useValue: {
            api: {
              updateUser: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(USER_REPOSITORY);
    i18nService = module.get(I18nService);
    betterAuthService = module.get(BetterAuthService);

    // Setup default mock implementations
    userRepository.findById.mockResolvedValue(mockUser);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.update.mockImplementation(
      async (id, data) =>
        ({
          ...mockUser,
          ...Object.entries(data).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, any>,
          ),
          updatedAt: new Date(),
        }) as any,
    );
    i18nService.t.mockImplementation((key) => key as string);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneUser', () => {
    it('should return a user if found', async () => {
      const result = await service.findOneUser('1');
      expect(result).toBeDefined();
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      await expect(service.findOneUser('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updateDto: UpdateUserProfileDto = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
      };

      const result = await service.updateUserProfile('1', updateDto, {
        headers: {},
      });

      expect(result).toBeDefined();
      expect(userRepository.update).toHaveBeenCalledWith('1', {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
      });
    });

    it('should not update auth service if no auth-related fields are updated', async () => {
      const updateDto: UpdateUserProfileDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      await service.updateUserProfile('1', updateDto, {
        headers: {},
      });

      expect(betterAuthService.api.updateUser).not.toHaveBeenCalled();
    });

    it('should check for duplicate email', async () => {
      const existingUser = { ...mockUser, id: '2' };
      userRepository.findByEmail.mockResolvedValueOnce(existingUser);

      const updateDto: UpdateUserProfileDto = {
        email: 'duplicate@example.com',
      };

      await expect(
        service.updateUserProfile('1', updateDto, { headers: {} }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      userRepository.delete.mockResolvedValueOnce(mockUser);
      const result = await service.deleteUser('1');
      expect(result).toBe(200);
      expect(userRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.delete.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );
      await expect(service.deleteUser('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      // Create mock users that match the Prisma User type
      const mockUsers = [
        {
          ...mockUser,
          deletedAt: null,
          displayUsername: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          image: 'https://example.com/avatar.jpg',
          bio: null,
          twoFactorEnabled: false,
        },
      ];

      // Create a proper OffsetPaginationDto instance
      const mockPagination = new OffsetPaginationDto(1, {
        page: 1,
        limit: 10,
        offset: 0, // Add required offset property
        order: 'ASC', // Add required order property
      } as any);

      // Create the expected repository response structure
      const mockPaginatedResponse = {
        data: mockUsers,
        pagination: mockPagination,
      };

      // Mock the repository's findAll method with the correct signature (page, limit)
      userRepository.findAll.mockResolvedValueOnce(mockPaginatedResponse);

      // Create a valid QueryUsersOffsetDto
      const queryDto = {
        page: 1,
        limit: 10,
        offset: 0, // Add required offset property
        order: 'ASC', // Add required order property
      } as any; // Cast to any to avoid type issues

      const result = await service.findAllUsers(queryDto);

      // Verify the structure matches OffsetPaginatedUserDto
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result.pagination).toMatchObject({
        limit: 10,
        currentPage: 1,
        totalRecords: 1,
        totalPages: 1,
      });

      // Verify the repository was called with the correct parameters
      expect(userRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });
});
