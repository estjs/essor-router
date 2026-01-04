import process from 'node:process';
import { type ConstructorOptions, JSDOM } from 'jsdom';
import { template as _template$, createComponent as h, insert, mapNodes } from 'essor';
import { type RouteRecordNormalized, type Router, type RouterOptions, createRouter } from '../src';
import type {
  MatcherLocation,
  RouteComponent,
  RouteLocationNormalized,
  RouteRecordMultipleViews,
  RouteRecordName,
  RouteRecordRaw,
  _RouteRecordProps,
} from '../src/types';

export const tick = (time?: number) =>
  new Promise(resolve => {
    if (time) setTimeout(resolve, time);
    else process.nextTick(resolve);
  });

export async function ticks(n: number) {
  for (let i = 0; i < n; i++) {
    await tick();
  }
}

export const delay = (t: number) => new Promise(r => setTimeout(r, t));

export function nextNavigation(router: Router) {
  return new Promise((resolve, reject) => {
    const removeAfter = router.afterEach((_to, _from, failure) => {
      removeAfter();
      removeError();
      resolve(failure);
    });
    let removeError = router.onError(err => {
      removeAfter();
      removeError();
      reject(err);
    });
  });
}

export interface RouteRecordViewLoose extends Pick<
  RouteRecordMultipleViews,
  'path' | 'name' | 'meta' | 'beforeEnter'
> {
  leaveGuards?: any;
  updateGuards?: any;
  instances: Record<string, any>;
  enterCallbacks: Record<string, Function[]>;
  props: Record<string, _RouteRecordProps>;
  aliasOf: RouteRecordNormalized | RouteRecordViewLoose | undefined;
  children?: RouteRecordRaw[];
  components: Record<string, RouteComponent> | null | undefined;
}

// @ts-expect-error we are intentionally overriding the type
export interface RouteLocationNormalizedLoose extends RouteLocationNormalized {
  name: RouteRecordName | null | undefined;
  path: string;
  // record?
  params: any;
  redirectedFrom?: Partial<MatcherLocation>;
  meta: any;
  matched: Partial<RouteRecordViewLoose>[];
}

export interface MatcherLocationNormalizedLoose {
  name: string;
  path: string;
  // record?
  params: any;
  redirectedFrom?: Partial<MatcherLocation>;
  meta: any;
  matched: Partial<RouteRecordViewLoose>[];
  instances: Record<string, any>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      window: JSDOM['window'];
      location: JSDOM['window']['location'];
      history: JSDOM['window']['history'];
      document: JSDOM['window']['document'];
      before?: Function;
    }
  }
}

export function createDom(options?: ConstructorOptions) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
    url: 'https://example.com/',
    referrer: 'https://example.com/',
    contentType: 'text/html',
    ...options,
  });
  try {
    global.window = dom.window as any;
    global.location = dom.window.location as any;
    global.history = dom.window.history as any;
    global.document = dom.window.document as any;
  } catch {}
  return dom;
}

export const noGuard = (to, from, next) => {
  next();
};

export function Home() {
  const _$tmpl = _template$('<div>Home</div>');
  return (() => {
    const _$el = _$tmpl();
    return _$el;
  })();
}
export function Foo() {
  const _$tmpl = _template$('<div>Foo</div>');
  return (() => {
    const _$el = _$tmpl();
    return _$el;
  })();
}

export function Bar() {
  const _$tmpl = _template$('<div>Bar</div>');
  return (() => {
    const _$el = _$tmpl();
    return _$el;
  })();
}
export function BeforeLeave() {
  const _$tmpl = _template$('<div>before leave</div>');
  return (() => {
    const _$el = _$tmpl();
    return _$el;
  })();
}

export function User(props) {
  const _$tmpl = _template$('<div>User:</div>');
  return (() => {
    const _$el = _$tmpl();
    const _$nodes = mapNodes(_$el, [1]);
    insert(_$nodes[0], () => props.id);
    return _$el;
  })();
}

export function Nested() {
  const _$tmpl = _template$('<div>Nested</div>');
  return (() => {
    const _$el = _$tmpl();
    return _$el;
  })();
}
export const components = {
  Home,
  Foo,
  Bar,
  User,
  Nested,
  BeforeLeave,
};

export function newRouter(options: Partial<RouterOptions> & { routes: RouteRecordRaw[] }) {
  return createRouter({
    history: options.history || 'history',
    ...options,
  });
}

export function mount(code, props = {}) {
  const container = document.createElement('div');
  const instance = h(code, props);
  const nodes = instance.mount(container);

  return {
    nodes,
    innerHTML: () => container.innerHTML,
    text: () => container.textContent,
    get: name => container.querySelector(name),
    unmount: () => instance.destroy(),
  };
}

export function mockWarn() {
  const mockFn = vi.spyOn(console, 'warn');

  expect.extend({
    toHaveBeenWarned(received) {
      const calls = mockFn.mock.calls;
      const passed = calls.some(args =>
        typeof received === 'string' ? args[0].includes(received) : received.test(args[0]),
      );

      if (passed) {
        return {
          pass: true,
          message: () => `expected not to have been warned with "${received}"`,
        };
      } else {
        const msgs = calls.map(args => args[0]).join('\n - ');
        return {
          pass: false,
          message: () => `expected to have been warned with "${received}", but got:\n - ${msgs}`,
        };
      }
    },
    toHaveBeenWarnedTimes(received, times) {
      const calls = mockFn.mock.calls;

      const receivedCalls = calls.filter(args => args[0] === received);

      const pass = receivedCalls.flat().length === times;

      if (pass) {
        return {
          pass: true,
          message: () => `expected "${received}" to have been warned ${times} times`,
        };
      } else {
        return {
          pass: false,
          message: () =>
            `expected "${received}" to have been warned ${times} times, but got ${receivedCalls.length} times`,
        };
      }
    },
  });
}

export const sleep = time => new Promise(resolve => setTimeout(resolve, time));
