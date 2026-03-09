import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { MainLayout } from '../layouts';
import { HomePage } from '../features/home/pages/HomePage';
import { ProyectistasPage } from '../features/users/pages/ProyectistasPage';
import { TrabajosPage } from '../features/works/pages/TrabajosPage';
import { WorkDetailsPage } from '../features/works/pages/WorkDetailsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { ActsCatalogPage } from '../features/acts/ActsCatalogPage';

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
        path: 'works/:id',
        element: <WorkDetailsPage />,
      },
      {
        path: 'proyectistas',
        element: <ProyectistasPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'acts',
        element: <ActsCatalogPage />,
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};