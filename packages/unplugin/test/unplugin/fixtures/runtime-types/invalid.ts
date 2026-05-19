import { defineConfigRoutes } from '../../../../src/config';

defineConfigRoutes([
  // @ts-expect-error `path` is required
  {
    name: 'missing-path',
    component: () => Promise.resolve({ default: null }),
  },
]);

defineConfigRoutes([
  {
    path: '/',
    // @ts-expect-error `name` must be a string
    name: 1,
    component: () => Promise.resolve({ default: null }),
  },
]);

defineConfigRoutes([
  {
    path: '/',
    component: () => Promise.resolve({ default: null }),
    // @ts-expect-error `alias` is not supported by config routes
    alias: '/home',
  },
]);

defineConfigRoutes([
  {
    path: '/',
    // @ts-expect-error `component` must be a lazy loader function
    component: Promise.resolve({ default: null }),
  },
]);

defineConfigRoutes([
  {
    path: '/settings',
    children: [
      {
        // @ts-expect-error child route `path` must be a string
        path: 1,
      },
    ],
  },
]);
