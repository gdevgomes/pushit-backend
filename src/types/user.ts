export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
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
  username: string;
  name: string;
  email: string;
  timezone: string;
  push_token?: string;
}

export type NewUser = {
  username: string;
  email: string;
  passwordHash: string;
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
