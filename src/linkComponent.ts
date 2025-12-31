import { insert, mapNodes, memoEffect, omitProps, patchAttr, template } from 'essor';
const _$tmpl = template('<a></a>');
export function LinkComponent(props) {
  const currentProps = omitProps(props, ['children']);
  const _$el = _$tmpl() as Element;
  const _$nodes = mapNodes(_$el, [1]) as Element[];

  insert(_$nodes[0], () => props.children);
  memoEffect(
    (_p$: any) => {
      const _v$0 = currentProps;
      _v$0 !== _p$._0 && patchAttr(_$nodes[0], '_$spread$', _p$._0, (_p$._0 = _v$0));
      return _p$;
    },
    {
      _0: undefined,
    },
  );
  return _$el;
}
