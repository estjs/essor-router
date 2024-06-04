import {
  type Signal,
  h,
  onDestroy,
  template,
  useComputed,
  useEffect,
  useInject,
  useProvide,
  useSignal,
} from 'essor';
import { routerStore } from './store';
import { viewDepthKey } from './injectionSymbols';
import { installRouter, unMountRouter } from './router';
import type { RouteLocationNormalized } from './types';
export interface RouterViewProps {
  name?: string;
  route?: RouteLocationNormalized;
  children?: any;
}

export const RouterView = (props: RouterViewProps) => {
  const injectedDepth = useInject(viewDepthKey, 0) as Signal<number>;
  installRouter && installRouter();

  const routeToDisplay = useComputed<RouteLocationNormalized>(
    () => props.route || routerStore.state.currentRouter,
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

  routerStore.setCurrent(routeToDisplay.value as any);

  const renderView = useComputed(() => {
    const ViewComponent =
      matchedRouteRef.value && matchedRouteRef.value.components[props.name || 'default'];
    return ViewComponent ? h(ViewComponent, {}) : props.children;
  });

  onDestroy(() => {
    unMountRouter && unMountRouter();
  });

  return h(template(''), {
    '0': {
      children: [[() => renderView.value, null]],
    },
  });
};
