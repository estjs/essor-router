import { type PrefixTree, collectDuplicatedRouteNodes } from '../core/tree';
import { toStringLiteral } from '../utils';

/**
 * Generates runtime warnings for `_parent` conflicts.
 *
 * @param tree - prefix tree to scan
 *
 * @internal
 */
export function generateDuplicatedRoutesWarnings(tree: PrefixTree): string {
  const conflicts = collectDuplicatedRouteNodes(tree);
  if (!conflicts.length) return '';

  return conflicts
    .map((group) => {
      // Compose the full multi-line message first, then escape it as a single
      // literal so file paths containing quotes/backslashes/newlines stay safe.
      const fullPath = group.at(0)!.node.fullPath;
      const files = group.map(({ filePath }) => `- ${filePath}`).join('\n');
      const message = `[essor-router] Conflicting files found for route "${fullPath}":\n${files}`;
      return `console.warn(${toStringLiteral(message)})`;
    })
    .join('\n');
}
