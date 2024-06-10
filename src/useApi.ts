import { routerStore } from './store';

export function useRouter() {
  return routerStore.getRouter.value;
}

export function useRoute() {
  return routerStore.getCurrentRouter.value;
}
