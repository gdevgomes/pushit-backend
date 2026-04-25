export type AccountType = 'device' | 'local' | 'provider';

export interface User {
  id: number;
  account_type: AccountType;
  device_id: string | null;
  username: string | null;
  email: string | null;
  passwordHash: string | null;
}

export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  timezone: string;
  push_token?: string;
}

export interface PublicUser {
  id: number;
  account_type: AccountType;
  username: string | null;
  name: string;
  email: string | null;
  timezone: string;
  push_token?: string;
}

export type NewUser = {
  username?: string | null;
  email?: string | null;
  passwordHash?: string | null;
  account_type?: AccountType;
  device_id?: string | null;
};

export type NewUserProfile = {
  user_id: number;
  name: string;
  timezone: string;
};

export type FindUser = { email: string };

export type RegisterInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
};

export interface UserProvider {
  id: number;
  user_id: number;
  provider: string;
  provider_id: string;
  email?: string | null;
}

export type NewUserProvider = Omit<UserProvider, 'id'>;
