import { type Signal, computed, createComponent, inject, provide, signal } from 'essor';
import { matchedRouteKey, routerViewLocationKey, viewDepthKey } from './injectionSymbols';
import { initRouter } from './router';
import { type RouteLocationNormalized, START_LOCATION_NORMALIZED } from './types';
import type { Router } from './router';
export interface RouterViewProps {
  name?: string;
  route?: RouteLocationNormalized;
  children?: unknown;
  router: Router;
}

export const RouterView = (props: RouterViewProps) => {
  const state = initRouter && (initRouter() as any);
  const injectedRoute = inject(routerViewLocationKey) || (state && state.currentRoute);
  const routeToDisplay = computed<RouteLocationNormalized>(
    () => props.route || (injectedRoute ? injectedRoute.value : START_LOCATION_NORMALIZED),
  );
  const injectedDepth = inject<Signal<number>>(viewDepthKey, signal(0));
  const depth = computed<number>(() => {
    let initialDepth = injectedDepth.value || 0;
    const { matched } = routeToDisplay.value! as RouteLocationNormalized;
    let matchedRoute;
    while ((matchedRoute = matched[initialDepth]) && !matchedRoute.components) {
      initialDepth++;
    }
    return initialDepth;
  });

  const matchedRouteRef = computed<any>(() => routeToDisplay.value!.matched[depth.value]);

  // Keep these for backward compatibility with existing useRoute/onBeforeRouteLeave etc.
  provide(viewDepthKey, computed(() => depth.value + 1) as any);
  provide(matchedRouteKey, matchedRouteRef);
  provide(routerViewLocationKey, routeToDisplay);

  const renderView = computed(() => {
    const ViewComponent =
      matchedRouteRef.value && matchedRouteRef.value.components[props.name || 'default'];

    return ViewComponent ? createComponent(ViewComponent, {}) : props.children;
  });
  return [() => renderView.value];
};
