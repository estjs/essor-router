import MagicString from 'magic-string';
import { parse as babelParseImpl } from '@babel/parser';
import type { Program } from '@babel/types';

export { MagicString };

export function getLang(id: string): string {
  const clean = id.split('?')[0] || id;
  const ext = clean.slice(clean.lastIndexOf('.') + 1);
  return ext || '';
}

export function babelParse(code: string, lang: string): Program {
  const isTs = /tsx?|mts|cts/.test(lang);
  const isJsx = /tsx|jsx/.test(lang);
  const ast = babelParseImpl(code, {
    sourceType: 'module',
    plugins: [
      'importAttributes',
      isTs ? 'typescript' : undefined,
      isJsx ? 'jsx' : undefined,
    ].filter(Boolean) as any[],
  }) as any;
  return ast.program as Program;
}

export function isCallOf(node: any, name: string): boolean {
  return (
    node?.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === name
  );
}

export function checkInvalidScopeReference(..._args: any[]): void {}

export function generateTransform(s: MagicString, _id: string) {
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}
