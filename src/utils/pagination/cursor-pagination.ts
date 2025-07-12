type PrismaModelDelegate<T = any> = {
  findMany: (args?: any) => Promise<T[]>;
  count: (args?: any) => Promise<number>;
};

/**
 * Order direction for pagination
 */
type OrderDirection = 'asc' | 'desc';

/**
 * Builds a paginator instance with the provided options
 */
export function buildPaginator<T>(options: PaginationOptions<T>): Paginator<T> {
  const { query = {}, paginationKeys = ['id' as keyof T] } = options;

  const paginator = new Paginator<T>(paginationKeys);

  if (query.afterCursor) {
    paginator.setAfterCursor(query.afterCursor);
  }

  if (query.beforeCursor) {
    paginator.setBeforeCursor(query.beforeCursor);
  }

  if (query.limit) {
    paginator.setLimit(query.limit);
  }

  if (query.order) {
    paginator.setOrder(query.order as OrderDirection);
  }

  return paginator;
}

export default class Paginator<T> {
  private afterCursor: string | null = null;

  private beforeCursor: string | null = null;

  private nextAfterCursor: string | null = null;

  private nextBeforeCursor: string | null = null;

  private paginationKeys: (keyof T)[];

  private limit = 100;

  private order: OrderDirection = 'desc';

  public constructor(paginationKeys: (keyof T)[]) {
    this.paginationKeys = paginationKeys;
  }

  public setAfterCursor(cursor: string): void {
    this.afterCursor = cursor;
  }

  public setBeforeCursor(cursor: string): void {
    this.beforeCursor = cursor;
  }

  public setLimit(limit: number): void {
    this.limit = limit;
  }

  public setOrder(order: OrderDirection): void {
    this.order = order;
  }

  public async paginate(
    model: PrismaModelDelegate<T>,
    where: any = {},
    orderBy: OrderDirection = 'desc',
    include?: any,
    select?: any,
  ): Promise<PagingResult<T>> {
    // Build the query options
    const findManyArgs: any = {
      where,
      take: this.limit + 1, // Get one extra to determine if there are more items
      orderBy: { [String(this.paginationKeys[0])]: orderBy },
    };

    // Add cursor if provided
    if (this.afterCursor) {
      findManyArgs.cursor = {
        [String(this.paginationKeys[0])]: this.afterCursor,
      };
      findManyArgs.skip = 1; // Skip the cursor item
    } else if (this.beforeCursor) {
      // For before cursor, we need to reverse the order, take the limit, then reverse back
      findManyArgs.orderBy = {
        [String(this.paginationKeys[0])]: orderBy === 'asc' ? 'desc' : 'asc',
      };
      findManyArgs.cursor = {
        [String(this.paginationKeys[0])]: this.beforeCursor,
      };
      findManyArgs.skip = 1;
    }

    // Add include/select if provided
    if (include) {
      findManyArgs.include = include;
    } else if (select) {
      findManyArgs.select = select;
    }

    // Execute the query
    const items = await model.findMany(findManyArgs);
    const hasMore = items.length > this.limit;
    const records = hasMore ? items.slice(0, -1) : items;

    // Reverse back if using beforeCursor
    const orderedRecords = this.beforeCursor ? [...records].reverse() : records;

    // Set cursors
    if (orderedRecords.length > 0) {
      this.nextAfterCursor = encodeCursor({
        [this.paginationKeys[0]]: orderedRecords[orderedRecords.length - 1],
      });
      this.nextBeforeCursor = encodeCursor({
        [this.paginationKeys[0]]: orderedRecords[0],
      });
    }

    const hasPrevious =
      this.afterCursor !== null || (this.beforeCursor !== null && hasMore);
    const hasNext = this.beforeCursor !== null || hasMore;

    return {
      data: orderedRecords,
      cursor: {
        afterCursor: hasNext ? this.nextAfterCursor : null,
        beforeCursor: hasPrevious ? this.nextBeforeCursor : null,
      },
    };
  }

  private flipOrder(order: OrderDirection): OrderDirection {
    return order === 'asc' ? 'desc' : 'asc';
  }
}

export interface PagingQuery {
  afterCursor?: string;
  beforeCursor?: string;
  limit?: number;
  order?: OrderDirection;
}

export interface PaginationOptions<T> {
  query?: PagingQuery;
  paginationKeys?: (keyof T)[];
}

interface Cursor {
  beforeCursor: string | null;
  afterCursor: string | null;
}

interface PagingResult<T> {
  data: T[];
  cursor: Cursor;
}

function encodeCursor(payload: Record<string, any>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Helper function to decode cursor (marked with _ to indicate it's intentionally unused for now)
function _decodeCursor(cursor: string): Record<string, any> {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
}
