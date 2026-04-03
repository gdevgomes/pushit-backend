export type User = NewUser & {
  id: string;
  passwordHash: string;
};

export type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
  timezone: string;
};

export type FindUser = { email: string };
