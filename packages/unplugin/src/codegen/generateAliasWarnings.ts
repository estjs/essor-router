import { toStringLiteral } from '../utils';
import type { PrefixTree } from '../core/tree';

/**
 * Generates runtime warnings for aliases that are not absolute paths.
 *
 * @param tree - prefix tree to scan
 *
 * @internal
 */
export function generateAliasWarnings(tree: PrefixTree): string {
  const warnings: string[] = [];

  for (const node of tree.getChildrenDeepSorted()) {
    for (const alias of node.value.alias) {
      if (!alias.startsWith('/')) {
        // Build the message as a plain string and escape it as a whole so an
        // alias or route path containing a quote/backslash/newline cannot break
        // out of the generated string literal.
        const message =
          `[essor-router] Alias "${alias}" for route "${node.value.fullPath}" ` +
          `must be absolute (start with "/"). Relative aliases are not supported in file-based routing.`;
        warnings.push(`console.warn(${toStringLiteral(message)})`);
      }
    }
  }

  return warnings.join('\n');
}
