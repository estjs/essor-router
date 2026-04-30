import { warn } from './warning';
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from './types';

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

export interface RouterScrollBehavior {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    savedPosition: _ScrollPositionNormalized | null,
  ): Awaitable<ScrollPosition | false | void>;
}

export interface ScrollPositionElement extends ScrollToOptions {
  el: string | Element;
}

export type ScrollPosition = ScrollPositionCoordinates | ScrollPositionElement;
type Awaitable<T> = T | PromiseLike<T>;

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

export const computeScrollPosition = (): _ScrollPositionNormalized => ({
  left: window.scrollX,
  top: window.scrollY,
});

export function scrollToPosition(position: ScrollPosition): void {
  let scrollToOptions: ScrollPositionCoordinates;

  if ('el' in position) {
    const positionEl = position.el;
    const isIdSelector = typeof positionEl === 'string' && positionEl.startsWith('#');

    if (
      __DEV__ &&
      typeof position.el === 'string' &&
      (!isIdSelector || !document.getElementById(position.el.slice(1)))
    ) {
      try {
        const foundEl = document.querySelector(position.el);
        if (isIdSelector && foundEl) {
          warn(
            `The selector "${position.el}" should be passed as "el: document.querySelector('${position.el}')" because it starts with "#".`,
          );
          return;
        }
      } catch {
        warn(
          `The selector "${position.el}" is invalid. If you are using an id selector, make sure to escape it. You can find more information at https://mathiasbynens.be/notes/css-escapes.`,
        );
        return;
      }
    }

    const el =
      typeof positionEl === 'string'
        ? isIdSelector
          ? document.getElementById(positionEl.slice(1))
          : document.querySelector(positionEl)
        : positionEl;

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
    window.scrollTo(
      scrollToOptions.left != null ? scrollToOptions.left : window.scrollX,
      scrollToOptions.top != null ? scrollToOptions.top : window.scrollY,
    );
  }
}

export function getScrollKey(path: string, delta: number): string {
  const position: number = history.state ? (history.state.position as number) - delta : -1;
  return position + path;
}

export const scrollPositions = new Map<string, _ScrollPositionNormalized>();

export function saveScrollPosition(key: string, scrollPosition: _ScrollPositionNormalized) {
  scrollPositions.set(key, scrollPosition);
}

export function getSavedScrollPosition(key: string) {
  const scroll = scrollPositions.get(key);
  scrollPositions.delete(key);
  return scroll;
}
