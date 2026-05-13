import { type Stats } from 'node:fs';
import { watch as fsWatch, type FSWatcher } from 'chokidar';
import { camelCase } from '@estjs/shared';
import { parse as parsePathe, relative, resolve } from 'pathe';
import picomatch from 'picomatch';
import { glob } from 'tinyglobby';
import { getPollingWatchOptions } from './watcherOptions';
import type { ParamParsersMap } from '../codegen/generateParamParsers';

export const PARAM_PARSER_GLOB = '*.{ts,js}';

export interface ParamParserFileInfo {
  fileName: string;
  name: string;
  typeName: `Param_${string}`;
  absolutePath: string;
  relativePath: string;
}

export function getParamParserFileInfo(
  folder: string,
  file: string,
  dtsDir: string,
): ParamParserFileInfo {
  const fileName = parsePathe(file).name;
  const name = camelCase(fileName);
  const absolutePath = resolve(folder, file);

  return {
    fileName,
    name,
    typeName: `Param_${name}`,
    absolutePath,
    relativePath: relative(dtsDir, absolutePath),
  };
}

export function setParamParserFile(
  paramParsersMap: ParamParsersMap,
  folder: string,
  file: string,
  dtsDir: string,
) {
  const { fileName, name, typeName, absolutePath, relativePath } = getParamParserFileInfo(
    folder,
    file,
    dtsDir,
  );
  paramParsersMap.set(fileName, {
    name,
    typeName,
    absolutePath,
    relativePath,
  });
}

export function deleteParamParserFile(paramParsersMap: ParamParsersMap, file: string) {
  paramParsersMap.delete(parsePathe(file).name);
}

export async function scanParamParserFolder(
  paramParsersMap: ParamParsersMap,
  folder: string,
  dtsDir: string,
) {
  const paramParserFiles = await glob(PARAM_PARSER_GLOB, {
    cwd: folder,
    onlyFiles: true,
    expandDirectories: false,
  });

  for (const file of paramParserFiles) {
    setParamParserFile(paramParsersMap, folder, file, dtsDir);
  }
}

export function createParamParserWatcher(
  folder: string,
  onAdd: (file: string) => void,
  onUnlink: (file: string) => void,
): FSWatcher {
  const isParamParserMatch = picomatch(PARAM_PARSER_GLOB);

  return fsWatch('.', {
    cwd: folder,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ...getPollingWatchOptions(),
    ignored: (filePath: string, stats?: Stats) => {
      // let folders pass, they are ignored by the glob pattern
      if (!stats || stats.isDirectory()) {
        return false;
      }

      return !isParamParserMatch(relative(folder, filePath));
    },
  })
    .on('add', onAdd)
    .on('unlink', onUnlink);
}
