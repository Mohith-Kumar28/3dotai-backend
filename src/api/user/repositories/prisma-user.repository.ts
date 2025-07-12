import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto as OffsetPageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto as OffsetPaginatedDtoClass } from '@/common/dto/offset-pagination/paginated.dto';
import { PrismaService } from '@/database/prisma/prisma.service';
import { buildPaginator } from '@/utils/pagination/cursor-pagination';

import { IUserRepository } from './user.repository.interface';

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

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<OffsetPaginatedDtoClass<User>> {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: { deletedAt: null }, // Only non-deleted users
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    // Create page options with default values and override what we need
    const pageOptions = new OffsetPageOptionsDto();
    Object.assign(pageOptions, {
      page,
      limit,
    });

    // Create pagination metadata
    const pagination = new OffsetPaginationDto(total, pageOptions);

    // Return paginated response
    return new OffsetPaginatedDtoClass(items, pagination);
  }

  async findAllCursor(
    cursor: string | undefined,
    limit: number,
  ): Promise<CursorPaginatedDto<User>> {
    // Get total count for pagination metadata
    const totalRecords = await this.prisma.user.count();

    // Create paginator instance
    const paginator = buildPaginator<User>({
      query: {
        afterCursor: cursor,
        limit,
        order: 'desc',
      },
    });

    // Execute paginated query
    const result = await paginator.paginate(
      this.prisma.user,
      {},
      'desc',
      undefined,
      {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    );

    // Create page options with the correct limit
    const pageOptions = new OffsetPageOptionsDto();

    // Create pagination metadata using the CursorPaginationDto constructor
    const pagination = new CursorPaginationDto(
      totalRecords,
      result.cursor.afterCursor || '',
      result.cursor.beforeCursor || '',
      { ...pageOptions, limit, page: 1 } as OffsetPageOptionsDto,
    );

    // Return the paginated result
    return new CursorPaginatedDto(result.data, pagination);
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
