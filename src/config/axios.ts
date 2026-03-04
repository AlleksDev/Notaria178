// src/config/axios.ts
import axios from 'axios';

// Creamos la instancia apuntando a la URL base de tu API en Go
export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de que salga cualquier petición, le pegamos el JWT
api.interceptors.request.use(
  (config) => {
    // Más adelante guardaremos el token en el LocalStorage o Zustand
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);