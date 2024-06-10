import { createStore, isSignal } from 'essor';
import { hasChanged } from 'essor-shared';
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
      const newRouter = isSignal(router) ? router.peek() : router;

      if (hasChanged(newRouter, this.router)) {
        this.router = newRouter;
      }
    },
    setCurrent(currentRouter) {
      const newCurrentRouter = isSignal(currentRouter) ? currentRouter.peek() : currentRouter;

      if (hasChanged(newCurrentRouter, this.currentRouter)) {
        this.currentRouter = newCurrentRouter;
      }
    },
    reset() {
      this.currentRouter = START_LOCATION_NORMALIZED;
    },
  },
});

export const routerStore = useRouterStore();
