import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType({ description: 'Input type for updating a user profile' })
export class UpdateUserInput {
  @Field({ nullable: true, description: "User's first name" })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @Field({ nullable: true, description: "User's email address" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true, description: "URL to the user's profile image" })
  @IsString()
  @IsOptional()
  image?: string;

  @Field({ nullable: true, description: "User's biography" })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @Field(() => Role, { nullable: true, description: "User's role" })
  @IsOptional()
  role?: Role;
}
