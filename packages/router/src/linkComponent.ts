import { insert, isSignal, memoEffect, omitProps, patchAttr } from 'essor';
import { isFunction, isObject } from '@estjs/shared';

export function LinkComponent(props) {
  if (typeof document === 'undefined') {
    return null;
  }

  const el = document.createElement('a');
  props.onElement?.(el);

  el.addEventListener('click', (event) => {
    props.onClick?.(event);

    const currentTarget = event.currentTarget as Element | null;
    const target = currentTarget?.getAttribute('target');
    const shouldPreventDefault =
      !event.defaultPrevented &&
      !event.metaKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      (event.button === undefined || event.button === 0) &&
      !(target && /\b_blank\b/i.test(target));

    if (shouldPreventDefault) {
      event.preventDefault();
    }
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
