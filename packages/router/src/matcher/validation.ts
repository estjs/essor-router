import { warn } from '../warning';
import type { RouteRecordNormalized } from './types';
import type { RouteRecordMatcher } from './pathMatcher';

type ParamKey = RouteRecordMatcher['keys'][number];

function isSameParam(a: ParamKey, b: ParamKey): boolean {
  return a.name === b.name && a.optional === b.optional && a.repeatable === b.repeatable;
}

export function checkSameParams(a: RouteRecordMatcher, b: RouteRecordMatcher) {
  for (const key of a.keys) {
    if (!key.optional && !b.keys.some(isSameParam.bind(null, key))) {
      warn(
        `Alias "${b.record.path}" and the original record: "${a.record.path}" must have the exact same param named "${key.name}"`,
      );
      return;
    }
  }

  for (const key of b.keys) {
    if (!key.optional && !a.keys.some(isSameParam.bind(null, key))) {
      warn(
        `Alias "${b.record.path}" and the original record: "${a.record.path}" must have the exact same param named "${key.name}"`,
      );
      return;
    }
  }
}

export function checkChildMissingNameWithEmptyPath(
  record: RouteRecordNormalized,
  parent?: RouteRecordMatcher,
) {
  if (parent && parent.record.name && !record.name && !record.path) {
    warn(
      `The route named "${String(
        parent.record.name,
      )}" has a child without a name and an empty path. Move the route name to the child or set a child name explicitly.`,
    );
  }
}

export function checkMissingParamsInAbsolutePath(
  record: RouteRecordMatcher,
  parent: RouteRecordMatcher,
) {
  for (const key of parent.keys) {
    if (!record.keys.some(isSameParam.bind(null, key))) {
      warn(
        `Absolute path "${record.record.path}" must have the exact same param named "${key.name}" as its parent "${parent.record.path}".`,
      );
      return;
    }
  }
}

export function isRecordChildOf(record: RouteRecordMatcher, parent: RouteRecordMatcher): boolean {
  return parent.children.some((child) => child === record || isRecordChildOf(record, child));
}
