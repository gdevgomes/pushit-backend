export interface Group {
  id: number;
  name: string;
  description?: string;
  code: string;
  owner_id: number;
}

export interface NewGroup {
  name: string;
  description?: string;
  owner_id: number;
}

export interface UserGroup {
  user_id: number;
  group_id: number;
}
