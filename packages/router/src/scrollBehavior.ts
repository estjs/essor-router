import { isString } from '@estjs/shared';
import { warn } from './warning';
import { LRUCache } from './utils/lru';
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScrollPositionCoordinates = {
  behavior?: ScrollOptions['behavior'];
  left?: number;
  top?: number;
};

export type _ScrollPositionNormalized = {
  behavior?: ScrollOptions['behavior'];
  left: number;
  top: number;
};

export interface ScrollPositionElement extends ScrollToOptions {
  el: string | Element;
}

export type ScrollPosition = ScrollPositionCoordinates | ScrollPositionElement;

type Awaitable<T> = T | PromiseLike<T>;

export interface RouterScrollBehavior {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    savedPosition: _ScrollPositionNormalized | null,
  ): Awaitable<ScrollPosition | false | void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SCROLL_POSITIONS = 50;

// ---------------------------------------------------------------------------
// Scroll position storage (LRU-capped Map)
// ---------------------------------------------------------------------------

export interface ScrollPositionStore {
  readonly size: number;
  has(key: string): boolean;
  save(key: string, scrollPosition: _ScrollPositionNormalized): void;
  get(key: string): _ScrollPositionNormalized | undefined;
  clear(): void;
}

export function createScrollPositionStore(limit = MAX_SCROLL_POSITIONS): ScrollPositionStore {
  const positions = new LRUCache<string, _ScrollPositionNormalized>(limit);

  return {
    get size() {
      return positions.size;
    },
    has(key: string) {
      return positions.has(key);
    },
    save(key: string, scrollPosition: _ScrollPositionNormalized) {
      positions.set(key, scrollPosition);
    },
    get(key: string) {
      return positions.getAndRemove(key);
    },
    clear() {
      positions.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Scroll key derivation
// ---------------------------------------------------------------------------

export function getScrollKey(path: string, delta: number): string {
  const position: number = history.state
    ? (history.state as { position: number }).position - delta
    : -1;
  return position + path;
}

// ---------------------------------------------------------------------------
// Scroll computation & execution
// ---------------------------------------------------------------------------

export const computeScrollPosition = (): _ScrollPositionNormalized => ({
  left: window.scrollX,
  top: window.scrollY,
});

function getElementPosition(
  el: Element,
  offset: ScrollPositionCoordinates,
): _ScrollPositionNormalized {
  const docRect = document.documentElement.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return {
    behavior: offset.behavior,
    left: elRect.left - docRect.left - (offset.left || 0),
    top: elRect.top - docRect.top - (offset.top || 0),
  };
}

/**
 * DEV-only: validate an element selector and warn about common mistakes.
 * Returns `true` if validation passed (or was skipped), `false` if the
 * caller should abort early.
 */
function validateElementSelector(selector: string, isIdSelector: boolean): boolean {
  try {
    const el = document.querySelector(selector);
    if (!el && isIdSelector) {
      warn(
        `The selector "${selector}" should be passed as "el: document.querySelector('${selector}')" because it starts with "#".`,
      );
      return false;
    }
  } catch {
    warn(
      `The selector "${selector}" is invalid. If you are using an id selector, make sure to escape it. You can find more information at https://mathiasbynens.be/notes/css-escapes.`,
    );
    return false;
  }
  return true;
}

function resolveScrollElement(positionEl: string | Element): Element | null {
  if (!isString(positionEl)) return positionEl;

  return document.querySelector(positionEl);
}

export function scrollToPosition(position: ScrollPosition): void {
  let scrollToOptions: ScrollPositionCoordinates;

  if ('el' in position) {
    const positionEl = position.el;
    const isIdSelector = isString(positionEl) && positionEl.startsWith('#');

    if (__DEV__ && isString(positionEl) && !validateElementSelector(positionEl, isIdSelector)) {
      return;
    }

    const el = resolveScrollElement(positionEl);
    if (!el) {
      __DEV__ &&
        warn(`Couldn't find element using selector "${position.el}" returned by scrollBehavior.`);
      return;
    }

    scrollToOptions = getElementPosition(el, position);
  } else {
    scrollToOptions = position;
  }

  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo(scrollToOptions);
  } else {
    window.scrollTo(scrollToOptions.left ?? window.scrollX, scrollToOptions.top ?? window.scrollY);
  }
}
