import { getLang } from '../compat/macroCommon';
import { pad, toStringLiteral } from '../utils';
import type { TreeNode, TreeNodeNamed } from '../core/tree';

function getTypedRouteSource(node: TreeNodeNamed): string {
  const defaultFilePath = node.value.components.get('default');
  const firstFilePath = defaultFilePath || Array.from(node.value.components.values())[0];

  if (!firstFilePath) {
    return 'never';
  }

  const lang = getLang(firstFilePath);
  const definePageModulePath = `${firstFilePath}?definePage&${
    lang === 'essor' ? 'essor&lang.tsx' : `lang.${lang}`
  }`;

  return `InferRouteDefinitionFromDefinePageModule<typeof import(${toStringLiteral(definePageModulePath)})>`;
}

export function generateRouteTreeMap(node: TreeNode): string {
  if (node.isRoot()) {
    return `export interface RouteTreeMap {
${node
  .getChildrenSorted()
  .map(n => generateRouteTreeMap(n))
  .join('')}}`;
  }

  const current =
    node.value.components.size && node.isNamed()
      ? pad(
          2,
          `${toStringLiteral(node.name)}: RouteTreeNodeInfo<
    ${toStringLiteral(node.name)},
    ${toStringLiteral(node.fullPath)},
    InferRouteSearch<${getTypedRouteSource(node)}>,
    InferRouteLoaderData<${getTypedRouteSource(node)}>,
    InferRouteBeforeLoadData<${getTypedRouteSource(node)}>,
    InferRouteStartOptions<${getTypedRouteSource(node)}>
  >,\n`,
        )
      : '';

  const nested =
    node.children.size > 0
      ? node
          .getChildrenSorted()
          .map(n => generateRouteTreeMap(n))
          .join('\n')
      : '';

  return current + nested;
}
