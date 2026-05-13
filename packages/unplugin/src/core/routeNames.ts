import { camelCase, isString } from '@estjs/shared';
import type { TreeNode } from './tree';
import type { TreePathParam } from './treeNodeValue';

function paramToName({ paramName, modifier, isSplat }: TreePathParam) {
  return `${isSplat ? '$' : ''}${paramName.charAt(0).toUpperCase() + paramName.slice(1)}${
    modifier
    // ? modifier === '+'
    //   ? 'OneOrMore'
    //   : modifier === '?'
    //   ? 'ZeroOrOne'
    //   : 'ZeroOrMore'
    // : ''
  }`;
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

/**
 * Creates a name based of the node path segments.
 *
 * @param node - the node to get the path from
 * @param parent - the parent node
 * @returns a route name
 */
export function getPascalCaseRouteName(node: TreeNode): string {
  if (node.parent?.isRoot() && node.value.pathSegment === '') return 'Root';

  let name = node.value.subSegments
    .map((segment) => {
      if (isString(segment)) {
        return capitalize(camelCase(segment));
      }
      // else it's a param
      return paramToName(segment);
    })
    .join('');

  if (node.value.components.size && node.children.has('index')) {
    name += 'Parent';
  }

  const parent = node.parent;

  return (
    (parent && !parent.isRoot() ? getPascalCaseRouteName(parent).replace(/Parent$/, '') : '') + name
  );
}

/**
 * Joins the path segments of a node into a name that corresponds to the filepath represented by the node.
 *
 * @param node - the node to get the path from
 * @returns a route name
 */
export function getFileBasedRouteName(node: TreeNode): string {
  if (!node.parent) return '';
  return `${getFileBasedRouteName(node.parent)}/${
    node.value.rawSegment === 'index' ? '' : node.value.rawSegment
  }`;
}
