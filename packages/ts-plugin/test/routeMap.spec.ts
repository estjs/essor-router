import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { guessProjectRoot, loadRouteMapFromDts, mapFileToRoute } from '../src/routeMap';

describe('routeMap', () => {
  it('loads route map entries via _RouteFileInfoMap', () => {
    const root = mkdtempSync(join(tmpdir(), 'ts-plugin-map-'));
    const file = join(root, 'typed-router.d.ts');
    writeFileSync(
      file,
      `declare module 'essor-router' {
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>
    '/users/:id': RouteRecordInfo<'/users/:id', '/users/:id', { id: string }, { id: string }>
  }
  export interface _RouteFileInfoMap {
    'src/pages/index.tsx': {
      routes: | '/'
      views: | never
    }
    'src/pages/users/[id].tsx': {
      routes: | '/users/:id'
      views: | never
    }
  }
}`,
      'utf8',
    );

    const map = loadRouteMapFromDts(root, 'typed-router.d.ts');

    const indexRoutes = map.get('src/pages/index.tsx');
    expect(indexRoutes).toBeDefined();
    expect(indexRoutes![0].pathPattern).toBe('/');

    const usersRoutes = map.get('src/pages/users/[id].tsx');
    expect(usersRoutes).toBeDefined();
    expect(usersRoutes![0].params).toEqual({ id: 'string' });
  });

  it('returns empty map when typed-router file is missing', () => {
    const map = loadRouteMapFromDts('/missing-root', 'typed-router.d.ts');
    expect(map.size).toBe(0);
  });

  it('returns multiple route infos for a single file when routes are unioned', () => {
    const root = mkdtempSync(join(tmpdir(), 'ts-plugin-map-multi-'));
    const file = join(root, 'typed-router.d.ts');
    writeFileSync(
      file,
      `declare module 'essor-router' {
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>
  }
  export interface _RouteFileInfoMap {
    'src/pages/home.tsx': {
      routes: | '/' | '/about'
      views: | never
    }
  }
}`,
      'utf8',
    );

    const map = loadRouteMapFromDts(root, 'typed-router.d.ts');
    const infos = map.get('src/pages/home.tsx');
    expect(infos?.length).toBe(2);
  });

  it('infers catch-all params as string[]', () => {
    const root = mkdtempSync(join(tmpdir(), 'ts-plugin-catchall-'));
    const file = join(root, 'typed-router.d.ts');
    writeFileSync(
      file,
      `declare module 'essor-router' {
  export interface RouteNamedMap {
    '/files/:path(.*)*': RouteRecordInfo<'/files/[...path]', '/files/:path(.*)*', { path: string[] }, { path: string[] }>
  }
  export interface _RouteFileInfoMap {
    'src/pages/files/[...path].tsx': {
      routes: | '/files/:path(.*)*'
      views: | never
    }
  }
}`,
      'utf8',
    );

    const map = loadRouteMapFromDts(root, 'typed-router.d.ts');
    const infos = map.get('src/pages/files/[...path].tsx');
    expect(infos?.[0].params).toEqual({ path: 'string[]' });
  });

  it('maps file path to route name', () => {
    const routeName = mapFileToRoute('/repo/src/pages/users/[id].tsx', '/repo');
    expect(routeName).toBe('users-id');
  });

  it('maps route name from custom routes folder', () => {
    const routeName = mapFileToRoute('/repo/app/routes/users/[...all].tsx', '/repo', 'app/routes');
    expect(routeName).toBe('users-all-all');
  });

  it('maps route name when routes folder is not found in path', () => {
    const routeName = mapFileToRoute('/repo/src/views/page.tsx', '/repo', 'src/pages');
    expect(routeName).toBe('src-views-page');
  });

  it('guesses project root from custom routes folder', () => {
    const root = guessProjectRoot(
      '/repo/app/routes/users/[id].tsx',
      'app/routes',
      'typed-router.d.ts',
      '/repo',
    );
    expect(root).toBe('/repo');
  });

  it('handles Windows-style backslash paths in mapFileToRoute', () => {
    // Simulate Windows path with backslashes (e.g. from process.cwd() on Windows)
    const routeName = mapFileToRoute(
      'C:\\repo\\src\\pages\\users\\[id].tsx'.replaceAll('\\', '/'),
      'C:\\repo'.replaceAll('\\', '/'),
    );
    expect(routeName).toBe('users-id');
  });

  it('handles Windows-style backslash paths in guessProjectRoot', () => {
    // Simulate guessProjectRoot with Windows-style path pre-normalized
    const winFile = 'C:\\repo\\src\\pages\\dashboard\\index.tsx'.replaceAll('\\', '/');
    const root = guessProjectRoot(winFile, 'src/pages', 'typed-router.d.ts', 'C:/repo');
    expect(root).toBe('C:/repo');
  });

  it('falls back to typed-router location when routes folder missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'ts-plugin-root-'));
    const typedRouterPath = join(root, 'typed-router.d.ts');
    writeFileSync(typedRouterPath, 'declare module "essor-router" {}', 'utf8');

    const filePath = join(root, 'src', 'components', 'Widget.tsx');
    const guessed = guessProjectRoot(filePath, 'nonexistent/routes', 'typed-router.d.ts', root);
    expect(guessed).toBe(root);
  });

  it('maps nested route with custom folder and Windows-style path', () => {
    const routeName = mapFileToRoute(
      'C:\\repo\\app\\routes\\blog\\[slug].tsx'.replaceAll('\\', '/'),
      'C:\\repo'.replaceAll('\\', '/'),
      'app/routes',
    );
    expect(routeName).toBe('blog-slug');
  });
});
