/// <reference types="vite/client" />
/// <reference types="@estjs/signals" />

declare module 'essor-router/auto-routes' {
  export const routes: import('essor-router').RouteRecordRaw[];
}
