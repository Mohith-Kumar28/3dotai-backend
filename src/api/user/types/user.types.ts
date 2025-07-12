import { Role } from '@prisma/client';

export interface User {
  id: string;
  username: string;
  displayUsername?: string;
  email: string;
  isEmailVerified: boolean;
  role: Role;
  firstName?: string;
  lastName?: string;
  image?: string;
  bio?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayUsername?: string;
  role?: Role;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  displayUsername?: string | null;
  image?: string | null;
  bio?: string | null;
  role?: Role;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  deletedAt?: Date | null;
}
