import { getLang } from '../compat/macroCommon';
import { pad, toStringLiteral } from '../utils';
import type { TreeNode, TreeNodeNamed } from '../core/tree';

function getTypedRouteSource(node: TreeNodeNamed): string {
  const components = node.value.components;
  const defaultFilePath = components.get('default');

  // Prefer the default view, fall back to any named view component
  const filePath = defaultFilePath || components.values().next().value;

  if (!filePath) {
    return 'never';
  }

  const lang = getLang(filePath);
  const definePageModulePath = `${filePath}?definePage&${
    lang === 'essor' ? 'essor&lang.tsx' : `lang.${lang}`
  }`;

  return `InferRouteDefinitionFromDefinePageModule<typeof import(${toStringLiteral(definePageModulePath)})>`;
}

export function generateRouteTreeMap(node: TreeNode): string {
  if (node.isRoot()) {
    return `export interface RouteTreeMap {
${node
  .getChildrenSorted()
  .map((n) => generateRouteTreeMap(n))
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
          .map((n) => generateRouteTreeMap(n))
          .join('\n')
      : '';

  return current + nested;
}
