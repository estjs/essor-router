import { warn } from './warning';
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

export const scrollPositions = new Map<string, _ScrollPositionNormalized>();

export function saveScrollPosition(key: string, scrollPosition: _ScrollPositionNormalized): void {
  // Move-to-end: delete first so re-insert becomes the newest entry
  scrollPositions.delete(key);
  scrollPositions.set(key, scrollPosition);

  // Evict oldest entries beyond the cap
  if (scrollPositions.size > MAX_SCROLL_POSITIONS) {
    const oldest = scrollPositions.keys().next().value;
    if (oldest != null) scrollPositions.delete(oldest);
  }
}

export function getSavedScrollPosition(key: string): _ScrollPositionNormalized | undefined {
  const scroll = scrollPositions.get(key);
  scrollPositions.delete(key);
  return scroll;
}

// ---------------------------------------------------------------------------
// Scroll key derivation
// ---------------------------------------------------------------------------

export function getScrollKey(path: string, delta: number): string {
  const position: number = history.state ? (history.state as { position: number }).position - delta : -1;
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
  if (!isIdSelector || !document.getElementById(selector.slice(1))) {
    try {
      const foundEl = document.querySelector(selector);
      if (isIdSelector && foundEl) {
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
  }
  return true;
}

function resolveScrollElement(positionEl: string | Element): Element | null {
  if (typeof positionEl !== 'string') return positionEl;

  const isIdSelector = positionEl.startsWith('#');
  return isIdSelector
    ? document.getElementById(positionEl.slice(1))
    : document.querySelector(positionEl);
}

export function scrollToPosition(position: ScrollPosition): void {
  let scrollToOptions: ScrollPositionCoordinates;

  if ('el' in position) {
    const positionEl = position.el;
    const isIdSelector = typeof positionEl === 'string' && positionEl.startsWith('#');

    if (__DEV__ && typeof positionEl === 'string' && !validateElementSelector(positionEl, isIdSelector)) {
      return;
    }

    const el = resolveScrollElement(positionEl);
    if (!el) {
      __DEV__ && warn(`Couldn't find element using selector "${position.el}" returned by scrollBehavior.`);
      return;
    }

    scrollToOptions = getElementPosition(el, position);
  } else {
    scrollToOptions = position;
  }

  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo(scrollToOptions);
  } else {
    window.scrollTo(
      scrollToOptions.left ?? window.scrollX,
      scrollToOptions.top ?? window.scrollY,
    );
  }
}
