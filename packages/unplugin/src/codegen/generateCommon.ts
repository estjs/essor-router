import { getLang } from '../compat/macroCommon';
import type { TreeNode } from '../core/tree';
import type { ImportsMap } from '../core/utils';

/**
 * Generates the list of import variable names for `definePage` data and registers
 * them in the `importsMap`. This logic is shared between `generateRouteRecords`
 * and `generateRouteResolver` to avoid duplication.
 *
 * @param node - the tree node that may have `definePage` information
 * @param importsMap - the imports map to register generated imports into
 * @returns an array of generated import variable names (empty if node has no definePage)
 */
export function generateDefinePageImports(node: TreeNode, importsMap: ImportsMap): string[] {
  const definePageDataList: string[] = [];

  if (!node.hasDefinePage) {
    return definePageDataList;
  }

  for (const [name, filePath] of node.value.components) {
    const pageDataImport = `_definePage_${name}_${importsMap.size}`;
    definePageDataList.push(pageDataImport);
    const lang = getLang(filePath);
    importsMap.addDefault(
      // Note: using the file lang to construct the virtual module query
      `${filePath}?definePage&${lang === 'essor' ? 'essor&lang.tsx' : `lang.${lang}`}`,
      pageDataImport,
    );
  }

  return definePageDataList;
}
