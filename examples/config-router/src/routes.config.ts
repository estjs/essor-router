import { defineConfigRoutes } from 'unplugin-essor-router';

export default defineConfigRoutes([
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/index.tsx'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('./pages/about.tsx'),
  },
  {
    path: '/users/:id',
    name: 'users-detail',
    component: () => import('./pages/users/[id].tsx'),
  },
  {
    path: '/post/:id?',
    component: () => import('./pages/post/[[id]].tsx'),
  },
  {
    path: '/nested',
    component: () => import('./pages/nested/_parent.tsx'),
    children: [
      {
        path: 'child',
        component: () => import('./pages/nested/child.tsx'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('./pages/[...catchAll].tsx'),
  },
]);
