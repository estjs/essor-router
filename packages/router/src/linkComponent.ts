import { insert, isSignal, memoEffect, omitProps, patchAttr } from 'essor';
import { isFunction, isObject } from '@estjs/shared';
import type { Signal } from 'essor';

interface LinkComponentProps {
  href: { readonly value: string } | string;
  onClick?: (e: MouseEvent) => void;
  onMouseenter?: (e: MouseEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onTouchstart?: (e: TouchEvent) => void;
  onElement?: (el: HTMLAnchorElement) => void;
  ariaCurrent?: { readonly value: string | null | undefined } | string | null;
  class?: { readonly value: string } | string;
  children?: unknown;
  [key: string]: unknown;
}

export function LinkComponent(props: LinkComponentProps): HTMLAnchorElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const el = document.createElement('a');
  props.onElement?.(el);

  el.addEventListener('click', (event) => {
    props.onClick?.(event);
  });
  el.addEventListener('mouseenter', (event) => props.onMouseenter?.(event));
  el.addEventListener('focus', (event) => props.onFocus?.(event));
  el.addEventListener('touchstart', (event) => props.onTouchstart?.(event));

  insert(el, () => {
    let child = isFunction(props.children) ? props.children() : props.children;
    if (isSignal(child) || (child && isObject(child) && 'value' in child)) {
      child = child.value;
    }
    return child;
  });

  memoEffect(
    (_p$: any) => {
      const source = omitProps(props, [
        'children',
        'onClick',
        'onMouseenter',
        'onFocus',
        'onTouchstart',
        'onElement',
      ]);
      const next: Record<string, any> = {};

      for (const key in source) {
        const value = source[key];
        next[key] =
          isSignal(value) || (value && isObject(value) && 'value' in value) ? value.value : value;
      }

      if ('ariaCurrent' in next) {
        next['aria-current'] = next.ariaCurrent;
        delete next.ariaCurrent;
      }

      next !== _p$._0 && patchAttr(el, '_$spread$', _p$._0, (_p$._0 = next));
      return _p$;
    },
    {
      _0: undefined,
    },
  );

  return el;
}
