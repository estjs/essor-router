export function warn(msg: string, ..._args: unknown[]): void;
export function warn(msg: string, ...args: unknown[]): void {
  console.warn(`[Essor Router warn]: ${msg}`, ...args);
}
