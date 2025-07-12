import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { DeleteUserInput } from './schema/delete-user.schema';
import { GetUserArgs } from './schema/get-user.schema';
import { UpdateUserInput } from './schema/update-user.schema';
import { UserSchema } from './schema/user.schema';
import { UserService } from './user.service';

@UseGuards(AuthGuard)
@Resolver(() => UserSchema)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserSchema, {
    description: 'Get the currently authenticated user',
  })
  async whoami(@CurrentUserSession('user') user: { id: string; role: Role }) {
    return this.userService.findOneUser(user.id);
  }

  @Query(() => [UserSchema], { description: 'Get all users (paginated)' })
  @Roles(Role.Admin)
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Query(() => UserSchema, { description: 'Get a user by ID' })
  @Roles(Role.Admin)
  async getUser(@Args() { id }: GetUserArgs) {
    return this.userService.findOneUser(id);
  }

  @Mutation(() => UserSchema, { description: 'Update user profile' })
  async updateProfile(
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
    @CurrentUserSession('user') currentUser: { id: string; role: Role },
  ) {
    // Users can only update their own profile unless they're an admin
    if (id !== currentUser.id && currentUser.role !== Role.Admin) {
      throw new Error('Unauthorized');
    }

    // Only admins can update roles
    if (input.role && currentUser.role !== Role.Admin) {
      throw new Error('Insufficient permissions to update role');
    }

    return this.userService.updateUserProfile(id, input, { headers: {} });
  }

  @Mutation(() => UserSchema, { description: 'Delete a user' })
  @Roles(Role.Admin)
  async deleteUser(@Args('input') userInput: DeleteUserInput) {
    return this.userService.deleteUser(userInput.id);
  }

  @ResolveField(() => UserSchema, { description: 'Self reference to the user' })
  async self(@Parent() user: UserSchema) {
    return this.userService.findOneUser(user.id);
  }
}
