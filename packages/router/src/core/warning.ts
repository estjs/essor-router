export function warn(msg: string, ...args: unknown[]): void {
  console.warn(`[Essor Router warn]: ${msg}`, ...args);
}

export function logRouterError(...args: unknown[]): void {
  console.error(...args);
}
