export function warn(msg: string, ..._args: unknown[]): void;
export function warn(msg: string, ...args: unknown[]): void {
  // eslint-disable-next-line prefer-spread
  console.warn.apply(console, [`[Essor Router warn]: ${msg}`].concat(args) as [string, ...unknown[]]);
}
