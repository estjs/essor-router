import { defineConfigRoutes } from '../../../../src/runtime';

defineConfigRoutes([
  {
    path: '/:all(.*)*',
    name: () => Promise.resolve('catch-all'),
    component: () => Promise.resolve({ default: null }),
  },
]);
