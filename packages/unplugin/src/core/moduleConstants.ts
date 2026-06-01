// essor-router/auto/routes was more natural but didn't work well with TS
export const MODULE_ROUTES_PATH = `essor-router/auto-routes`;
export const MODULE_RESOLVER_PATH = `essor-router/auto-resolver`;

// we used to have `/__` because HMR didn't work with `\0` virtual modules
// but it seems to work now, so switching to the official Vite virtual module prefix
export const VIRTUAL_PREFIX = '\0';

export function getVirtualId(id: string) {
  return id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : null;
}

export function asVirtualId(id: string) {
  return VIRTUAL_PREFIX + id;
}

export const DEFINE_PAGE_QUERY_RE = /[?&]definePage\b/;
