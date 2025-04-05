// types/user.ts
export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest'; 