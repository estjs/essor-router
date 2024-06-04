import { routerStore } from './store';

export function useRouter() {
  return routerStore.getRouter;
}

export function useRoute() {
  return routerStore.getCurrentRouter;
}
