import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { MainLayout } from '../layouts';
import { HomePage } from '../features/home/pages/HomePage';
import { ProyectistasPage } from '../features/users/pages/ProyectistasPage';
import { TrabajosPage } from '../features/works/pages/TrabajosPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'works',
        element: <TrabajosPage />,
      },
      {
        path: 'proyectistas',
        element: <ProyectistasPage />,
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};