export interface User {
  id: number;
  email: string;
  passwordHash: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  timezone: string;
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  timezone: string;
}

export type NewUser = {
  email: string;
  passwordHash: string;
};

export type NewUserProfile = {
  user_id: number;
  name: string;
  timezone: string;
};

export type FindUser = { email: string };
