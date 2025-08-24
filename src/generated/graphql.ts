
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum Role {
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
    USER = "USER"
}

export class DeleteUserInput {
    id: string;
}

export class UpdateUserInput {
    bio?: Nullable<string>;
    email?: Nullable<string>;
    firstName?: Nullable<string>;
    image?: Nullable<string>;
    lastName?: Nullable<string>;
    role?: Nullable<Role>;
}

export abstract class IMutation {
    abstract deleteUser(input: DeleteUserInput): UserSchema | Promise<UserSchema>;

    abstract updateProfile(id: string, input: UpdateUserInput): UserSchema | Promise<UserSchema>;
}

export abstract class IQuery {
    abstract getUser(id: string): UserSchema | Promise<UserSchema>;

    abstract getUsers(): UserSchema[] | Promise<UserSchema[]>;

    abstract whoami(): UserSchema | Promise<UserSchema>;
}

export class UserSchema {
    bio?: Nullable<string>;
    createdAt: DateTime;
    deletedAt?: Nullable<DateTime>;
    displayUsername?: Nullable<string>;
    email: string;
    firstName?: Nullable<string>;
    id: string;
    image?: Nullable<string>;
    isEmailVerified: boolean;
    lastName?: Nullable<string>;
    role: Role;
    self: UserSchema;
    twoFactorEnabled: boolean;
    updatedAt: DateTime;
    username: string;
}

export type DateTime = any;
type Nullable<T> = T | null;
