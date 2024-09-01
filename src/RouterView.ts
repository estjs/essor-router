import { type Signal, h, useComputed, useInject, useProvide } from 'essor';
import { matchedRouteKey, routerViewLocationKey, viewDepthKey } from './injectionSymbols';
import { initRouter } from './router';
import type { RouteLocationNormalized } from './types';
export interface RouterViewProps {
  name?: string;
  route?: RouteLocationNormalized;
  children?: any;
}

export const RouterView = (props: RouterViewProps) => {
  initRouter && initRouter();
  const injectedRoute = useInject(routerViewLocationKey)!;
  const injectedDepth = useInject(viewDepthKey, 0) as Signal<number>;
  const routeToDisplay = useComputed<RouteLocationNormalized>(
    () => props.route || injectedRoute.value,
  );
  const depth = useComputed<number>(() => {
    let initialDepth = injectedDepth.value || 0;
    const { matched } = routeToDisplay.value! as RouteLocationNormalized;
    let matchedRoute;
    while ((matchedRoute = matched[initialDepth]) && !matchedRoute.components) {
      initialDepth++;
    }
    return initialDepth;
  });

  const matchedRouteRef = useComputed<any>(() => routeToDisplay.value!.matched[depth.value]);
  useProvide(viewDepthKey, useComputed(() => depth.value + 1) as any);

  useProvide(matchedRouteKey, matchedRouteRef);
  useProvide(routerViewLocationKey, routeToDisplay);

  const renderView = useComputed(() => {
    const ViewComponent =
      matchedRouteRef.value && matchedRouteRef.value.components[props.name || 'default'];
    return ViewComponent ? h(ViewComponent, {}) : props.children;
  });
  return h('', {
    children: [[() => renderView.value, null]],
  });
};
