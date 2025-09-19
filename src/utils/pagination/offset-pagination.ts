import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { Prisma } from '@prisma/client';

type PrismaModelDelegate = {
  findMany: (args: any) => Promise<any[]>;
  count: (args: any) => Promise<number>;
};

type PaginateOptions = {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[];
  include?: Record<string, any>;
  select?: Record<string, any>;
  skipCount?: boolean;
  takeAll?: boolean;
};

export async function paginate<T>(
  model: PrismaModelDelegate,
  pageOptionsDto: PageOptionsDto,
  options: PaginateOptions = {},
): Promise<[T[], OffsetPaginationDto]> {
  const { skipCount = false, takeAll = false, ...prismaOptions } = options;

  // Build the findMany options
  const findManyOptions: any = {
    ...prismaOptions,
    skip: takeAll ? undefined : pageOptionsDto.offset,
    take: takeAll ? undefined : pageOptionsDto.limit,
  };

  // Execute queries in parallel
  const [items, total] = await Promise.all([
    model.findMany(findManyOptions) as Promise<T[]>,
    skipCount
      ? Promise.resolve(-1)
      : model.count({ where: prismaOptions.where }),
  ]);

  const metaDto = new OffsetPaginationDto(total as number, pageOptionsDto);

  return [items, metaDto];
}
