import { Role, User } from '@prisma/client';

export type CreateUserInput = {
  username: string;
  email: string;
  displayUsername?: string | null;
  isEmailVerified?: boolean;
  role?: Role;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  bio?: string | null;
  twoFactorEnabled?: boolean;
};

export type UpdateUserInput = Partial<
  Omit<CreateUserInput, 'email' | 'username'>
>;

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  update(id: string, user: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
  markEmailAsVerified(userId: string): Promise<void>;
}
