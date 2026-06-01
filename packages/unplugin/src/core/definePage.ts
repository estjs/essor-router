import { generate } from '@babel/generator';
import { walkAST } from 'ast-walker-scope';
import { type ParsedStaticImport, findStaticImports, parseStaticImport } from 'mlly';
import { isString } from '@estjs/shared';
import {
  MagicString,
  babelParse,
  checkInvalidScopeReference,
  generateTransform,
  getLang,
  isCallOf,
} from '../compat/macroCommon';
import { warn } from './utils';
import type { Thenable, TransformResult } from 'unplugin';
import type {
  CallExpression,
  ObjectExpression,
  ObjectProperty,
  Program,
  Statement,
  StringLiteral,
} from '@babel/types';
import type { ParamParserType } from '../contracts/routeDefinition';
import type { CustomRouteBlock } from './routeBlockTypes';

const MACRO_DEFINE_PAGE = 'definePage';
const MACRO_DEFINE_ROUTE = 'defineRoute';
const ROUTE_MACROS = [MACRO_DEFINE_PAGE, MACRO_DEFINE_ROUTE] as const;
export const MACRO_DEFINE_PAGE_QUERY = /[?&]definePage\b/;

interface RouteMacroCall {
  call: CallExpression;
  statement: Statement;
  macro: (typeof ROUTE_MACROS)[number];
}

function getRouteMacroCallFromStatement(statement: Statement): RouteMacroCall | null {
  if (
    statement.type === 'ExpressionStatement' &&
    ROUTE_MACROS.some((macro) => isCallOf(statement.expression, macro))
  ) {
    const macro = ROUTE_MACROS.find((macro) => isCallOf(statement.expression, macro))!;
    return {
      call: statement.expression as CallExpression,
      statement,
      macro,
    };
  }

  const variableDeclaration =
    statement.type === 'VariableDeclaration'
      ? statement
      : statement.type === 'ExportNamedDeclaration' &&
          statement.declaration?.type === 'VariableDeclaration'
        ? statement.declaration
        : null;

  if (!variableDeclaration) {
    return null;
  }

  for (const declaration of variableDeclaration.declarations) {
    const init = declaration.init;
    if (!init) continue;

    const macro = ROUTE_MACROS.find((m) => isCallOf(init, m));
    if (macro) {
      return {
        call: init as CallExpression,
        statement,
        macro,
      };
    }
  }

  return null;
}

/**
 * Generate the ast from a code string and an id. Works with SFC and non-SFC files.
 */
function getCodeAst(code: string, id: string) {
  const offset = 0;
  let ast: Program | undefined;
  const lang = getLang(id.split(MACRO_DEFINE_PAGE_QUERY)[0]!);
  if (/[jt]sx?$/.test(lang)) {
    ast = babelParse(code, lang);
  }

  const routeMacroCalls: RouteMacroCall[] = (ast?.body || [])
    .map((statement) => getRouteMacroCallFromStatement(statement as Statement))
    .filter((value): value is RouteMacroCall => !!value);

  return { ast, offset, routeMacroCalls };
}

export function definePageTransform({
  code,
  id,
}: {
  code: string;
  id: string;
}): Thenable<TransformResult> {
  // are we extracting only the definePage object
  const isExtractingDefinePage = MACRO_DEFINE_PAGE_QUERY.test(id);

  if (!ROUTE_MACROS.some((macro) => code.includes(macro))) {
    // avoid having an invalid module that is just empty
    // https://github.com/estjs/essor-router/issues
    return isExtractingDefinePage ? 'export default {}' : undefined;
  }

  let ast: Program | undefined;
  let offset: number;
  let routeMacroCalls: RouteMacroCall[];

  try {
    const result = getCodeAst(code, id);
    ast = result.ast;
    offset = result.offset;
    routeMacroCalls = result.routeMacroCalls;
  } catch (error) {
    // Handle any syntax errors or parsing errors gracefully
    warn(
      `[${id}]: Failed to process definePage: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return isExtractingDefinePage ? 'export default {}' : undefined;
  }

  if (!ast) return;

  if (!routeMacroCalls.length) {
    return isExtractingDefinePage
      ? // e.g. index.tsx?definePage that contains a commented `definePage()
        'export default {}'
      : // e.g. index.tsx that contains a commented `definePage()
        null;
  } else if (routeMacroCalls.length > 1) {
    throw new SyntaxError(`duplicate definePage()/defineRoute() call`);
  }

  const routeMacroCall = routeMacroCalls[0]!;
  const definePageNode = routeMacroCall.call;

  // we only want the page info
  if (isExtractingDefinePage) {
    const s = new MagicString(code);
    // remove everything except the page info

    const routeRecord = definePageNode.arguments[0];

    if (!routeRecord) {
      throw new SyntaxError(
        `[${id}]: definePage() expects an object expression as its only argument`,
      );
    }

    const scriptBindings = ast.body ? getIdentifiers(ast.body) : [];

    // TODO: remove information that was extracted already like name, path, params

    // this will throw if a property from the script setup is used in definePage
    try {
      checkInvalidScopeReference(routeRecord, routeMacroCall.macro, scriptBindings);
    } catch (error) {
      warn(
        `[${id}]: ${error instanceof Error ? error.message : 'Invalid scope reference in definePage'}`,
      );
      return 'export default {}';
    }

    s.remove(offset + routeRecord.end!, code.length);
    s.remove(0, offset + routeRecord.start!);
    s.prepend(`export default `);

    // find all static imports and filter out the ones that are not used
    const staticImports = findStaticImports(code);

    const usedIds = new Set<string>();
    const localIds = new Set<string>();

    walkAST(routeRecord, {
      enter(node) {
        // skip literal keys from object properties
        if (
          this.parent?.type === 'ObjectProperty' &&
          this.parent.key === node &&
          // still track computed keys [a + b]: 1
          !this.parent.computed &&
          node.type === 'Identifier'
        ) {
          this.skip();
        } else if (
          // filter out things like 'log' in console.log
          this.parent?.type === 'MemberExpression' &&
          this.parent.property === node &&
          !this.parent.computed &&
          node.type === 'Identifier'
        ) {
          this.skip();
          // types are stripped off so we can skip them
        } else if (node.type === 'TSTypeAnnotation') {
          this.skip();
          // track everything else
        } else if (node.type === 'Identifier' && !localIds.has(node.name)) {
          usedIds.add(node.name);
          // track local ids that could shadow an import
        } else if ('scopeIds' in node && node.scopeIds instanceof Set) {
          // avoid adding them to the usedIds list
          for (const id of node.scopeIds as Set<string>) {
            localIds.add(id);
          }
        }
      },
      leave(node) {
        if ('scopeIds' in node && node.scopeIds instanceof Set) {
          // clear out local ids
          for (const id of node.scopeIds as Set<string>) {
            localIds.delete(id);
          }
        }
      },
    });

    for (const imp of staticImports) {
      const importCode = generateFilteredImportStatement(parseStaticImport(imp), usedIds);
      if (importCode) {
        s.prepend(`${importCode}\n`);
      }
    }

    return generateTransform(s, id);
  } else {
    // console.log('!!!', definePageNode)

    const s = new MagicString(code);

    s.remove(offset + routeMacroCall.statement.start!, offset + routeMacroCall.statement.end!);

    return generateTransform(s, id);
  }
}

type DefinePageParamsInfo = NonNullable<CustomRouteBlock['params']>;

export interface DefinePageInfo {
  name?: string | false;
  path?: string;
  alias?: string[];
  params?: CustomRouteBlock['params'];
  validateSearch?: true;
  loader?: true;
  beforeLoad?: true;
  start?: CustomRouteBlock['start'];
  /**
   * Whether definePage has properties beyond the statically extracted ones
   * (name, path, alias, params)
   */
  hasRemainingProperties: boolean;
}

/**
 * Extracts name, path, and params from definePage(). Those do not require
 * extracting the whole definePage object as a different import
 */
export function extractDefinePageInfo(
  sfcCode: string,
  id: string,
): DefinePageInfo | null | undefined {
  if (!ROUTE_MACROS.some((macro) => sfcCode.includes(macro))) return;

  let ast: Program | undefined;
  let routeMacroCalls: RouteMacroCall[];

  try {
    const result = getCodeAst(sfcCode, id);
    ast = result.ast;
    routeMacroCalls = result.routeMacroCalls;
  } catch (error) {
    // Handle any syntax errors or parsing errors gracefully
    warn(
      `[${id}]: Failed to extract definePage info: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return undefined;
  }

  if (!ast) return;

  if (!routeMacroCalls.length) {
    return;
  } else if (routeMacroCalls.length > 1) {
    throw new SyntaxError(`duplicate definePage()/defineRoute() call`);
  }

  const definePageNode = routeMacroCalls[0]!.call;

  const routeRecord = definePageNode.arguments[0];
  if (!routeRecord) {
    throw new SyntaxError(
      `[${id}]: definePage() expects an object expression as its only argument`,
    );
  }

  if (routeRecord.type !== 'ObjectExpression') {
    throw new SyntaxError(
      `[${id}]: definePage() expects an object expression as its only argument`,
    );
  }

  const routeInfo: DefinePageInfo = { hasRemainingProperties: false };

  for (const prop of routeRecord.properties) {
    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
      if (prop.key.name === 'name') {
        if (
          prop.value.type !== 'StringLiteral' &&
          (prop.value.type !== 'BooleanLiteral' || prop.value.value !== false)
        ) {
          warn(`route name must be a string literal or false. Found in "${id}".`);
        } else {
          // TODO: why does TS not narrow down the type?
          routeInfo.name = prop.value.value as string | false;
        }
      } else if (prop.key.name === 'path') {
        if (prop.value.type !== 'StringLiteral') {
          warn(`route path must be a string literal. Found in "${id}".`);
        } else {
          routeInfo.path = prop.value.value;
        }
      } else if (prop.key.name === 'alias') {
        routeInfo.alias = extractRouteAlias(prop.value, id);
      } else if (prop.key.name === 'params') {
        if (prop.value.type === 'ObjectExpression') {
          routeInfo.params = extractParamsInfo(prop.value, id);
        }
      } else if (prop.key.name === 'validateSearch') {
        routeInfo.validateSearch = true;
        routeInfo.hasRemainingProperties = true;
      } else if (prop.key.name === 'loader') {
        routeInfo.loader = true;
        routeInfo.hasRemainingProperties = true;
      } else if (prop.key.name === 'beforeLoad') {
        routeInfo.beforeLoad = true;
        routeInfo.hasRemainingProperties = true;
      } else if (prop.key.name === 'start') {
        if (prop.value.type === 'ObjectExpression') {
          routeInfo.start = extractStartInfo(prop.value);
        }
        routeInfo.hasRemainingProperties = true;
      } else {
        routeInfo.hasRemainingProperties = true;
      }
    }
  }

  return routeInfo;
}

function extractStartInfo(startObj: ObjectExpression): NonNullable<DefinePageInfo['start']> {
  const start: NonNullable<DefinePageInfo['start']> = {};

  for (const prop of startObj.properties) {
    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && !prop.computed) {
      if (
        (prop.key.name === 'ssr' || prop.key.name === 'prerender') &&
        prop.value.type === 'BooleanLiteral'
      ) {
        start[prop.key.name] = prop.value.value;
      } else if (
        prop.key.name === 'preload' &&
        prop.value.type === 'StringLiteral' &&
        ['intent', 'render', 'viewport'].includes(prop.value.value)
      ) {
        start.preload = prop.value.value as 'intent' | 'render' | 'viewport';
      }
    }
  }

  return start;
}

function extractParamsInfo(paramsObj: ObjectExpression, id: string): DefinePageParamsInfo {
  const params: DefinePageParamsInfo = {};

  for (const prop of paramsObj.properties) {
    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
      if (prop.key.name === 'query' && prop.value.type === 'ObjectExpression') {
        params.query = extractQueryParams(prop.value, id);
      } else if (prop.key.name === 'path' && prop.value.type === 'ObjectExpression') {
        params.path = extractPathParams(prop.value, id);
      }
    }
  }

  return params;
}

function extractQueryParams(
  queryObj: ObjectExpression,
  _id: string,
): NonNullable<DefinePageInfo['params']>['query'] {
  const queryParams: NonNullable<DefinePageInfo['params']>['query'] = {};

  for (const prop of queryObj.properties) {
    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
      const paramName = prop.key.name;

      // we normalize short form for convenience
      if (prop.value.type === 'StringLiteral') {
        queryParams[paramName] = {
          parser: prop.value.value as ParamParserType,
        };
      } else if (prop.value.type === 'ObjectExpression') {
        // Full form: param: { parser: 'int', default: 1, format: 'value' }
        const paramInfo: (typeof queryParams)[string] = {};

        for (const paramProp of prop.value.properties) {
          if (paramProp.type === 'ObjectProperty' && paramProp.key.type === 'Identifier') {
            if (paramProp.key.name === 'parser' && paramProp.value.type === 'StringLiteral') {
              paramInfo.parser = paramProp.value.value as ParamParserType;
            } else if (
              paramProp.key.name === 'queryKey' &&
              paramProp.value.type === 'StringLiteral'
            ) {
              paramInfo.queryKey = paramProp.value.value;
            } else if (
              paramProp.key.name === 'format' &&
              paramProp.value.type === 'StringLiteral'
            ) {
              paramInfo.format = paramProp.value.value as 'value' | 'array';
            } else if (
              paramProp.key.name === 'required' &&
              paramProp.value.type === 'BooleanLiteral'
            ) {
              paramInfo.required = paramProp.value.value;
            } else if (paramProp.key.name === 'default') {
              if (isString(paramProp.value.extra?.raw)) {
                paramInfo.default = paramProp.value.extra.raw;
              } else if (paramProp.value.type === 'NumericLiteral') {
                paramInfo.default = String(paramProp.value.value);
              } else if (paramProp.value.type === 'StringLiteral') {
                paramInfo.default = JSON.stringify(paramProp.value.value);
              } else if (paramProp.value.type === 'BooleanLiteral') {
                paramInfo.default = String(paramProp.value.value);
              } else if (paramProp.value.type === 'NullLiteral') {
                paramInfo.default = 'null';
              } else if (
                paramProp.value.type === 'UnaryExpression' &&
                (paramProp.value.operator === '-' ||
                  paramProp.value.operator === '+' ||
                  paramProp.value.operator === '!' ||
                  paramProp.value.operator === '~') &&
                paramProp.value.argument.type === 'NumericLiteral'
              ) {
                // support negative numeric literals: -1, -1.5
                paramInfo.default = `${paramProp.value.operator}${paramProp.value.argument.value}`;
              } else if (paramProp.value.type === 'ArrowFunctionExpression') {
                paramInfo.default = generate(paramProp.value).code;
              } else {
                warn(
                  `Unrecognized default value in definePage() for query param "${paramName}". Typeof value: "${paramProp.value.type}". This is a bug or a missing type of value, open an issue on https://github.com/essorjs/router and provide the definePage() code.`,
                );
              }
            }
          }
        }

        queryParams[paramName] = paramInfo;
      }
    }
  }

  return queryParams;
}

function extractPathParams(
  pathObj: ObjectExpression,
  id: string,
): NonNullable<DefinePageInfo['params']>['path'] {
  const pathParams: NonNullable<DefinePageInfo['params']>['path'] = {};

  for (const prop of pathObj.properties) {
    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
      if (prop.value.type === 'StringLiteral') {
        pathParams[prop.key.name] = prop.value.value as ParamParserType;
      } else {
        warn(`path param parser "${prop.key.name}" must be a string literal. Found in "${id}".`);
      }
    }
  }

  return pathParams;
}

export function extractRouteAlias(
  aliasValue: ObjectProperty['value'],
  id: string,
): string[] | undefined {
  if (aliasValue.type !== 'StringLiteral' && aliasValue.type !== 'ArrayExpression') {
    warn(`route alias must be a string literal or an array of string literals. Found in "${id}".`);
  } else {
    return aliasValue.type === 'StringLiteral'
      ? [aliasValue.value]
      : aliasValue.elements
          .filter((node): node is StringLiteral => {
            if (node?.type === 'StringLiteral') {
              return true;
            }
            warn(
              `route alias array must only contain string literals. Found ${node?.type ? `"${node.type}" ` : ''}in "${id}".`,
            );
            return false;
          })
          .map((el) => el.value);
  }
  return undefined;
}

const getIdentifiers = (stmts: Statement[]) => {
  let ids: string[] = [];
  walkAST(
    {
      type: 'Program',
      body: stmts,
      directives: [],
      sourceType: 'module',
    },
    {
      enter(node) {
        if (node.type === 'BlockStatement') {
          this.skip();
        }
      },
      leave(node) {
        if (node.type !== 'Program') return;
        ids = Object.keys(this.scope);
      },
    },
  );

  return ids;
};

/**
 * Generate a filtere import statement based on a set of identifiers that should be kept.
 *
 * @param parsedImports - parsed imports with mlly
 * @param usedIds - set of used identifiers
 * @returns `null` if no import statement should be generated, otherwise the import statement as a string without a newline
 */
function generateFilteredImportStatement(parsedImports: ParsedStaticImport, usedIds: Set<string>) {
  if (!parsedImports || usedIds.size < 1) return null;

  const { namedImports, defaultImport, namespacedImport } = parsedImports;

  if (namespacedImport && usedIds.has(namespacedImport)) {
    return `import * as ${namespacedImport} from '${parsedImports.specifier}'`;
  }

  let importListCode = '';
  if (defaultImport && usedIds.has(defaultImport)) {
    importListCode += defaultImport;
  }

  let namedImportListCode = '';
  for (const importName in namedImports) {
    if (usedIds.has(importName)) {
      // add comma if we have more than one named import
      namedImportListCode += namedImportListCode ? `, ` : '';

      namedImportListCode +=
        importName === namedImports[importName]
          ? importName
          : `${importName} as ${namedImports[importName]}`;
    }
  }

  importListCode += importListCode && namedImportListCode ? ', ' : '';
  importListCode += namedImportListCode ? `{${namedImportListCode}}` : '';

  if (!importListCode) return null;

  return `import ${importListCode} from '${parsedImports.specifier}'`;
}
