import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

// Register the Role enum with GraphQL
registerEnumType(Role, {
  name: 'Role',
  description: 'User role for authorization',
});

@ObjectType({ description: 'A user in the system' })
export class UserSchema {
  @Field(() => ID, { description: 'Unique identifier for the user' })
  id: string;

  @Field({ description: 'Username, must be unique' })
  username: string;

  @Field({
    nullable: true,
    description: 'Display username, can be different from the login username',
  })
  displayUsername?: string;

  @Field({ description: 'Email address, must be unique' })
  email: string;

  @Field({ description: 'Whether the email has been verified' })
  isEmailVerified: boolean;

  @Field(() => Role, { description: 'User role for authorization' })
  role: Role;

  @Field({ nullable: true, description: "User's first name" })
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  lastName?: string;

  @Field({ nullable: true, description: "URL to the user's profile image" })
  image?: string;

  @Field({ nullable: true, description: "User's biography" })
  bio?: string;

  @Field({ description: 'Whether two-factor authentication is enabled' })
  twoFactorEnabled: boolean;

  @Field(() => Date, { description: 'When the user was created' })
  createdAt: Date;

  @Field(() => Date, { description: 'When the user was last updated' })
  updatedAt: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'When the user was deleted (soft delete)',
  })
  deletedAt?: Date;

  // Self-reference for the current user
  @Field(() => UserSchema, { description: 'Self reference to the user' })
  self: UserSchema;
}
