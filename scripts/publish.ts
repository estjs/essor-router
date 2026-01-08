#!/usr/bin/env zx

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { $ } from 'zx';

const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

const releaseTag = version.includes('beta')
  ? 'beta'
  : version.includes('alpha')
    ? 'alpha'
    : undefined;

console.log('Publishing version', version, 'with tag', releaseTag || 'latest');

if (releaseTag) {
  await $`pnpm -r publish --access public --no-git-checks --tag ${releaseTag}`;
} else {
  await $`pnpm -r publish --access public --no-git-checks`;
}
