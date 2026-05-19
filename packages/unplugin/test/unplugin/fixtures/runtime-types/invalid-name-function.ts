import { defineConfigRoutes } from '../../../../src/config';

defineConfigRoutes([
  {
    path: '/:all(.*)*',
    name: () => Promise.resolve('catch-all'),
    component: () => Promise.resolve({ default: null }),
  },
]);
