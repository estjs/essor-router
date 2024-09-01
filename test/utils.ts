import process from 'node:process';
import { type ConstructorOptions, JSDOM } from 'jsdom';
import { h as _h$, template as _template$ } from 'essor';
import {
  type RouteRecordNormalized,
  type Router,
  type RouterOptions,
  RouterView,
  createRouter,
} from '../src';
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

export interface RouteRecordViewLoose
  extends Pick<RouteRecordMultipleViews, 'path' | 'name' | 'meta' | 'beforeEnter'> {
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
    // @ts-expect-error: not the same window
    global.window = dom.window;
    global.location = dom.window.location;
    global.history = dom.window.history;
    global.document = dom.window.document;
  } catch {
    // it's okay, some are readonly
  }

  return dom;
}

export const noGuard = (to, from, next) => {
  next();
};
function Home() {
  return _h$(_template$('<div>Home</div>'), {});
}
function Foo() {
  return _h$(_template$('<div>Foo</div>'), {});
}
function Bar() {
  return _h$(_template$('<div>Bar</div>'), {});
}

export const components = {
  Home,
  Foo,
  Bar,
  User: {
    props: {
      id: {
        default: 'default',
      },
    },
  },

  Nested: () => {
    return _h$(_template$('<div><h2>Nested</h2></div>'), {
      '1': {
        children: [[() => _h$(RouterView, {}), null]],
      },
    });
  },
  BeforeLeave: () => {
    return _h$(_template$('<div>before leave</div>'), {});
  },
};

export function newRouter(options: Partial<RouterOptions> & { routes: RouteRecordRaw[] }) {
  return createRouter({
    history: options.history || 'history',
    ...options,
  });
}

export function mount(code, props = {}) {
  const container = document.createElement('div');
  const nodes = _h$(code, props).mount(container);

  return {
    nodes,
    innerHTML: () => container.innerHTML,
    text: () => container.textContent,
    get: name => container.querySelector(name),
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
