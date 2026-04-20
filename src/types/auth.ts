export type UserRole = 'Admin' | 'Regular';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}