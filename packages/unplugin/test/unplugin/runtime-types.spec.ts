import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, 'fixtures', 'runtime-types');

function getDiagnostics(fileName: string): string[] {
  const filePath = join(fixtureDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Missing fixture: ${filePath}`);
  }

  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true,
  });

  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (!diagnostic.file || typeof diagnostic.start !== "number")
      return message;

    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start,
    );
    return `${line + 1}:${character + 1} ${message}`;
  });
}

describe('defineConfigRoutes types', () => {
  it('accepts supported route config shapes', () => {
    expect(getDiagnostics('valid.ts')).toEqual([]);
  });

  it('rejects unsupported route config shapes', () => {
    expect(getDiagnostics('invalid.ts')).toEqual([]);
  });

  it('reports invalid field types without collapsing the whole route to never', () => {
    const diagnostics = getDiagnostics('invalid-name-function.ts');

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toContain("not assignable to type 'string'");
    expect(diagnostics[0]).not.toContain("not assignable to type 'never'");
  });
});
