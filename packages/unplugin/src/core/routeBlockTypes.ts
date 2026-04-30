import type { RouteRecordRaw } from '../contracts/router';
import type { DefinePageQueryParamOptions } from '../contracts/experimental';

export interface CustomRouteBlock extends Partial<
  Omit<RouteRecordRaw, 'components' | 'component' | 'children' | 'beforeEnter' | 'name' | 'alias'>
> {
  name?: string | undefined | false;

  alias?: string[];

  params?: {
    path?: Record<string, string>;

    query?: Record<string, string | CustomRouteBlockQueryParamOptions>;
  };

  validateSearch?: true;
  loader?: true;
  beforeLoad?: true;
  start?: CustomRouteBlockStartOptions;
}

export interface CustomRouteBlockQueryParamOptions {
  queryKey?: string;
  parser?: string;
  format?: DefinePageQueryParamOptions['format'];
  default?: string;
  required?: boolean;
}

export interface CustomRouteBlockStartOptions {
  ssr?: boolean;
  prerender?: boolean;
  preload?: 'intent' | 'render' | 'viewport';
}
