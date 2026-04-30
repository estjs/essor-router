import {
  insert,
  mapNodes,
  omitProps,
  patchAttr,
  setEvent,
  template,
} from 'essor';
import { isSignal, memoEffect } from '@estjs/signals';
const _$tmpl = template('<a></a>');
export function LinkComponent(props) {
  const _$el = _$tmpl() as Element;
  const _$nodes = mapNodes(_$el, [1]) as Element[];

  const attachEvent = (event: string, handler: unknown) => {
    if (typeof handler !== 'function') return;
    setEvent(_$nodes[0], event, handler as EventListener);
  };

  attachEvent('click', props.onClick);
  attachEvent('mouseenter', props.onMouseenter);
  attachEvent('focus', props.onFocus);
  attachEvent('touchstart', props.onTouchstart);

  insert(_$nodes[0], () => {
    let child = typeof props.children === 'function' ? props.children() : props.children;
    if (isSignal(child) || (child && typeof child === 'object' && 'value' in child)) {
      child = child.value;
    }
    return child;
  });
  memoEffect(
    (_p$: any) => {
      const _v$0 = omitProps(props, ['children']);
      const _next$0: Record<string, any> = {};
      for (const key in _v$0) {
        const value = _v$0[key];
        _next$0[key] =
          isSignal(value) || (value && typeof value === 'object' && 'value' in value)
            ? value.value
            : value;
      }
      _next$0 !== _p$._0 && patchAttr(_$nodes[0], '_$spread$', _p$._0, (_p$._0 = _next$0));
      return _p$;
    },
    {
      _0: undefined,
    },
  );
  return _$el;
}
