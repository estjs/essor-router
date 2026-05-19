import { defineConfigRoutes } from '../../../../src/config';

export default defineConfigRoutes([
  {
    path: '/',
    name: 'home',
    component: () => Promise.resolve({ default: null }),
  },
  {
    path: '/settings',
    children: [
      {
        path: 'profile',
        component: async () => ({ default: null }),
      },
    ],
  },
] as const);
