// src/features/auth/types/index.ts

export interface User {
  full_name: string;
  email: string;
  role: string;
  branch_id: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}