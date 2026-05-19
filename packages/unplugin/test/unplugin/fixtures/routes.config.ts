import { defineConfigRoutes } from '../../../src/public';

export default defineConfigRoutes([
  {
    name: 'home',
    path: '/',
    component: () => import('./pages/Home.tsx'),
  },
  {
    name: 'users-id',
    path: '/users/:id',
    component: () => import('./pages/UserDetail.tsx'),
  },
  {
    name: 'settings',
    path: '/settings',
    component: () => import('./pages/Settings.tsx'),
    children: [
      {
        name: 'settings-profile',
        path: 'profile',
        component: () => import('./pages/SettingsProfile.tsx'),
      },
    ],
  },
  {
    name: 'catch-all',
    path: '/:all(.*)*',
    component: () => import('./pages/NotFound.tsx'),
  },
]);
