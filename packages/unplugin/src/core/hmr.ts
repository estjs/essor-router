export type HotModuleName = 'routes' | 'resolver';

export function generateHmrHandleHotUpdate(): string {
  return `export function handleHotUpdate(_router, _hotUpdateCallback) {
  if (import.meta.hot) {
    import.meta.hot.data.router = _router
    import.meta.hot.data.router_hotUpdateCallback = _hotUpdateCallback
  }
}`;
}

export function generateHmrAccept(moduleName: HotModuleName, reloadBody: string): string {
  return `if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    const router = import.meta.hot.data.router
    if (!router) {
      import.meta.hot.invalidate('[essor-router:HMR] Cannot replace the ${moduleName} because there is no active router. Reloading.')
      return
    }
    ${reloadBody}
    // call the hotUpdateCallback for custom updates
    import.meta.hot.data.router_hotUpdateCallback?.(mod.${moduleName})
    const route = router.currentRoute.value
    router.replace({
      ${
        moduleName === 'routes'
          ? `...route,
      // NOTE: we should be able to just do ...route but the router
      // currently skips resolving and can give errors with renamed routes
      // so we explicitly set remove matched and name
      name: undefined,
      matched: undefined,`
          : `path: route.path,
      query: route.query,
      hash: route.hash,`
      }
      force: true
    })
  })
}`;
}

export function generateHmrBlock(moduleName: HotModuleName, reloadBody: string): string {
  return `${generateHmrHandleHotUpdate()}\n${generateHmrAccept(moduleName, reloadBody)}`;
}
