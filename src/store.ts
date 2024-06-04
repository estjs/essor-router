import { createStore, isSignal } from 'essor';
import { type RouteLocationNormalizedLoaded, START_LOCATION_NORMALIZED } from './types';
import type { Router } from './router';

export const useRouterStore = createStore({
  state: {
    router: {},
    currentRouter: START_LOCATION_NORMALIZED,
  } as {
    router: Router;
    currentRouter: RouteLocationNormalizedLoaded;
  },
  getters: {
    getRouter() {
      return this.router;
    },
    getCurrentRouter() {
      return this.currentRouter;
    },
  },
  actions: {
    setRouter(router) {
      this.router = isSignal(router) ? router.peek() : router;
    },
    setCurrent(currentRouter) {
      this.currentRouter = isSignal(currentRouter) ? currentRouter.peek() : currentRouter;
    },
    reset() {
      this.currentRouter = START_LOCATION_NORMALIZED;
    },
  },
});

export const routerStore = useRouterStore();
