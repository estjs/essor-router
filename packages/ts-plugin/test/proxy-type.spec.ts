import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'vitest';
import ts from 'typescript';
import { generateProxyModule } from '../src/proxyGenerator';

describe('generateProxyModule type inference', () => {
  const tempDir = join(__dirname, '.temp-proxy');
  const moduleDir = join(tempDir, 'node_modules', 'essor-router');

  beforeEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(moduleDir, { recursive: true });

    writeFileSync(
      join(moduleDir, 'package.json'),
      JSON.stringify({
        name: 'essor-router',
        version: '0.0.0-test',
        types: './index.d.ts',
      }),
      'utf8',
    );

    writeFileSync(
      join(moduleDir, 'index.d.ts'),
      `
export interface RouteLocationNormalizedLoaded {
  name: string
  path: string
  params: Record<string, string | string[]>
  meta: Record<string, unknown>
  matched: Array<unknown>
  redirectedFrom: RouteLocationNormalizedLoaded | null
}
export function useRoute(): RouteLocationNormalizedLoaded
declare const _default: unknown
export default _default
      `.trim(),
      'utf8',
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('generates a useRoute proxy that includes full RouteLocationNormalizedLoaded attributes', () => {
    const proxyCode = generateProxyModule('essor-router', {
      routeName: '/post/[[id]]',
      pathPattern: '/post/:id?',
      params: { id: 'string' },
    });

    const proxyFile = join(tempDir, 'proxy.ts');
    const consumerFile = join(tempDir, 'consumer.ts');

    writeFileSync(proxyFile, proxyCode, 'utf8');

    writeFileSync(
      consumerFile,
      `
      import { useRoute } from './proxy';
      const route = useRoute();
      
      const name: '/post/[[id]]' = route.name;
      const paramsId: string = route.params.id;
      
      // The crucial test: these properties must exist from the original RouteLocationNormalizedLoaded
      const meta = route.meta;
      const matched = route.matched;
      const redirectedFrom = route.redirectedFrom;
    `,
      'utf8',
    );

    const program = ts.createProgram([consumerFile], {
      noEmit: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      lib: ['lib.es2020.d.ts'],
      types: [],
      baseUrl: tempDir,
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);

    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    };

    if (diagnostics.length > 0) {
      const messages = ts.formatDiagnostics(diagnostics, formatHost);
      throw new Error(`TypeScript compilation failed:\\n${messages}`);
    }
  }, 20000);
});
