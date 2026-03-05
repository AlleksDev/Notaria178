// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Input } from '../../../components/Input';
import { useAuthStore } from '../../../store/authStore';
import { loginRequest } from '../api/login';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await loginRequest({ email, password });

      setAuth(data.data.user, data.data.token);
      navigate('/home');
      
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message || 'Error al conectar con el servidor. Verifica tus credenciales.'
        );
      } else {
        setError('Ocurrió un error inesperado al procesar la solicitud.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <p className="text-[11px] font-bold text-[#7A0B0B] tracking-wider mb-8 uppercase">
        Sistema de Gestión - Notaría 178
      </p>

      <h1 className="text-3xl text-gray-900 mb-1">Acceso</h1>
      <h2 className="text-3xl font-bold italic text-[#7A0B0B] mb-6">Autorizado</h2>

      <div className="flex items-center mb-8">
        <div className="h-[2px] w-12 bg-[#7A0B0B]"></div>
        <div className="h-[1px] flex-1 bg-gray-300"></div>
      </div>

      <p className="text-[13px] text-gray-500 mb-8 font-light">
        Ingresa tus datos para poder acceder al sistema
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {/* Quitamos el autoComplete="off" del form para permitir el gestor de contraseñas */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="CORREO ELECTRÓNICO" 
          type="email" 
          value={email} 
          onChange={setEmail}
          placeholder="ejemplo@correo.com"
          autoComplete="email"
        />

        <Input 
          label="Contraseña" 
          type="password" 
          value={password} 
          onChange={setPassword}
          placeholder="Escribe tu contraseña"
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-bold tracking-wider py-3.5 rounded hover:bg-[#5a0808] transition-colors mt-8 text-sm ${
            isLoading ? 'bg-[#7A0B0B]/70 cursor-wait' : 'bg-[#7A0B0B]'
          }`}
        >
          {isLoading ? 'VERIFICANDO...' : 'CONTINUAR'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <a href="#" className="text-[13px] text-gray-500 underline decoration-gray-400 underline-offset-4 hover:text-[#7A0B0B] transition-colors">
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </div>
  );
};