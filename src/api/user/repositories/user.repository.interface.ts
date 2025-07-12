import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Prisma, User } from '@prisma/client';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export type CreateUserInput = Prisma.UserCreateInput;
export type UpdateUserInput = Prisma.UserUpdateInput;

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<User>;
  findAll(page: number, limit: number): Promise<OffsetPaginatedDto<User>>;
  findAllCursor(
    cursor: string | undefined,
    limit: number,
  ): Promise<CursorPaginatedDto<User>>;
  count(): Promise<number>;
}
