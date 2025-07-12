import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

import {
  CreateUserInput,
  IUserRepository,
  UpdateUserInput,
} from './user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...userData,
        isEmailVerified: userData.isEmailVerified ?? false,
        twoFactorEnabled: userData.twoFactorEnabled ?? false,
        displayUsername: userData.displayUsername ?? userData.username,
      },
    });
  }

  async update(id: string, userData: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }
}
