import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@prisma/client';

type CurrentUser = User & {
  id: string;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUser, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const user = gqlCtx.getContext().req.user as CurrentUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
