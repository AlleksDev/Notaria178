// src/features/auth/api/login.ts
import { api } from '../../../config/axios';
import type { LoginResponse } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

export const loginRequest = async (credentials: LoginCredentials) => {
  const response = await api.post<LoginResponse>('/users/login', credentials);
  
  return response.data; 
};