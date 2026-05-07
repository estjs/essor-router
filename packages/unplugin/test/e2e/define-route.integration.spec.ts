import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { resolveOptions } from '../../src/options';
import { createRoutesContext } from '../../src/core/context';
import { RoutesFolderWatcher } from '../../src/core/RoutesFolderWatcher';

async function waitUntil(assertion: () => void | Promise<void>, timeout = 3000, interval = 50) {
  const end = Date.now() + timeout;
  let lastError: unknown;
  while (Date.now() < end) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  throw lastError;
}

describe('e2e: defineRoute generation', () => {
  it('generates route records and resolver from code-file routes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages');
      await mkdir(pagesDir, { recursive: true });

      await writeFile(
        join(pagesDir, 'index.tsx'),
        [
          `import { defineRoute } from 'essor-router/experimental'`,
          `export const route = defineRoute({`,
          `  name: 'home',`,
          `  path: '/',`,
          `  alias: ['/home'],`,
          `  validateSearch: (input) => ({ q: String(input.q ?? '') }),`,
          `  loader: async () => ({ home: true }),`,
          `  beforeLoad: () => ({ auth: true }),`,
          `  start: { ssr: true, preload: 'intent' },`,
          `})`,
          `export default function Home(){ return null }`,
          '',
        ].join('\n'),
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: false,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(false);

      const routesCode = await ctx.generateRoutes();
      const resolverCode = await ctx.generateResolver();
      const dtsPath = join(root, 'typed-router.d.ts');
      const dtsCode = await readFile(dtsPath, 'utf8');

      expect(routesCode).toContain(`name: 'home'`);
      expect(routesCode).toContain(`alias: ["/home"]`);
      expect(routesCode).toContain(`index.tsx`);

      expect(resolverCode).toContain(`name: 'home'`);
      expect(resolverCode).toContain(`MatcherPatternPathStatic('/home')`);
      expect(resolverCode).toContain(`createFixedResolver`);
      expect(dtsCode).toContain(`export interface RouteTreeMap`);
      expect(dtsCode).toContain(`'home': RouteTreeNodeInfo<`);
      expect(dtsCode).toContain(`InferRouteSearch<InferRouteDefinitionFromDefinePageModule`);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('removes route records after file unlink in watch mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    const waitFor = async (
      assertion: () => void | Promise<void>,
      timeout = 3000,
      interval = 50,
    ) => {
      const end = Date.now() + timeout;
      let lastError: unknown;
      while (Date.now() < end) {
        try {
          await assertion();
          return;
        } catch (error) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
      throw lastError;
    };

    try {
      const pagesDir = join(root, 'src/pages');
      await mkdir(pagesDir, { recursive: true });

      const aboutPage = join(pagesDir, 'about.tsx');
      await writeFile(
        aboutPage,
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'about' })
export default function About() { return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: true,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(true);

      expect(await ctx.generateRoutes()).toContain(`name: 'about'`);

      await unlink(aboutPage);

      await waitFor(async () => {
        expect(await ctx.generateRoutes()).not.toContain(`name: 'about'`);
      });

      ctx.stopWatcher();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('stops route watchers only once when stopWatcher is called repeatedly', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages');
      await mkdir(pagesDir, { recursive: true });
      await writeFile(
        join(pagesDir, 'index.tsx'),
        `export default function Home() { return null }
`,
      );

      const closeSpy = vi.spyOn(RoutesFolderWatcher.prototype, 'close');
      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: true,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(true);

      ctx.stopWatcher();
      ctx.stopWatcher();

      expect(closeSpy).toHaveBeenCalledTimes(1);
      closeSpy.mockRestore();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prioritizes custom-regex routes before plain dynamic routes in resolver', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages');
      await mkdir(pagesDir, { recursive: true });

      await writeFile(
        join(pagesDir, 'number.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({
  name: 'user-id-number',
  path: '/users/:id(\\\\d+)',
})
export default function NumberPage(){ return null }
`,
      );

      await writeFile(
        join(pagesDir, 'any.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({
  name: 'user-id-any',
  path: '/users/:id',
})
export default function AnyPage(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: false,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(false);

      const resolverCode = await ctx.generateResolver();
      const resolverLines = resolverCode
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('__route_') && line.includes('// /users/:id'));

      const regexRouteIndex = resolverLines.findIndex((line) =>
        line.endsWith('// /users/:id(\\d+)'),
      );
      const dynamicRouteIndex = resolverLines.findIndex((line) => line.endsWith('// /users/:id'));

      expect(regexRouteIndex).toBeGreaterThanOrEqual(0);
      expect(dynamicRouteIndex).toBeGreaterThanOrEqual(0);
      expect(regexRouteIndex).toBeLessThan(dynamicRouteIndex);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('sorts resolver routes by matcher specificity matrix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages');
      await mkdir(pagesDir, { recursive: true });

      await writeFile(
        join(pagesDir, 'a.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'users-new', path: '/users/new' })
export default function Page(){ return null }
`,
      );
      await writeFile(
        join(pagesDir, 'b.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'users-id-regex', path: '/users/:id(\\\\d+)' })
export default function Page(){ return null }
`,
      );
      await writeFile(
        join(pagesDir, 'c.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'users-id', path: '/users/:id' })
export default function Page(){ return null }
`,
      );
      await writeFile(
        join(pagesDir, 'd.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'users-id-optional', path: '/users/:id?' })
export default function Page(){ return null }
`,
      );
      await writeFile(
        join(pagesDir, 'e.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'users-id-repeatable', path: '/users/:id+' })
export default function Page(){ return null }
`,
      );
      await writeFile(
        join(pagesDir, 'f.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({ name: 'users-splat', path: '/users/:path(.*)' })
export default function Page(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: false,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(false);

      const resolverCode = await ctx.generateResolver();
      const orderedUserPaths = resolverCode
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('__route_') && line.includes('// /users/'))
        .map((line) => line.slice(line.indexOf('// ') + 3));

      const expectedOrder = [
        '/users/new',
        '/users/:id(\\d+)',
        '/users/:id',
        '/users/:id?',
        '/users/:id+',
        '/users/:path(.*)',
      ];

      for (let i = 0; i < expectedOrder.length - 1; i++) {
        const left = expectedOrder[i]!;
        const right = expectedOrder[i + 1]!;
        expect(orderedUserPaths.indexOf(left)).toBeGreaterThanOrEqual(0);
        expect(orderedUserPaths.indexOf(right)).toBeGreaterThanOrEqual(0);
        expect(orderedUserPaths.indexOf(left)).toBeLessThan(orderedUserPaths.indexOf(right));
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('handles group + _parent + alias/path override combinations', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages/(admin)/users');
      await mkdir(pagesDir, { recursive: true });

      await writeFile(
        join(pagesDir, '_parent.tsx'),
        `export default function UsersLayout(){ return null }`,
      );

      await writeFile(
        join(pagesDir, 'index.tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({
  name: 'users-home',
  alias: ['/people'],
})
export default function UsersHome(){ return null }
`,
      );

      await writeFile(
        join(pagesDir, '[id].tsx'),
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({
  name: 'users-by-id',
  path: '/people/:id',
  alias: ['/u/:id'],
})
export default function UserDetails(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: false,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(false);

      const routesCode = await ctx.generateRoutes();
      const resolverCode = await ctx.generateResolver();

      expect(routesCode).toContain(`name: 'users-home'`);
      expect(routesCode).toContain(`name: 'users-by-id'`);
      expect(resolverCode).toContain('// /users');
      expect(resolverCode).toContain('// /people');
      expect(resolverCode).toContain('// /people/:id');
      expect(resolverCode).toContain('// /u/:id');
      expect(resolverCode).not.toContain('// /(admin)');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps defineRoute merge metadata when updating sibling named-view files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages/dashboard');
      await mkdir(pagesDir, { recursive: true });

      const defaultView = join(pagesDir, 'index.tsx');
      const sidebarView = join(pagesDir, 'index@sidebar.tsx');

      await writeFile(
        defaultView,
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({
  name: 'dashboard',
  meta: { requiresAuth: true },
})
export default function Dashboard(){ return null }
`,
      );

      await writeFile(
        sidebarView,
        `export default function Sidebar(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: true,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(true);

      let routesCode = await ctx.generateRoutes();
      expect(routesCode).toContain('_mergeRouteRecord(');

      await writeFile(
        sidebarView,
        `export default function Sidebar(){ return 'updated' }
`,
      );

      const waitFor = async (
        assertion: () => void | Promise<void>,
        timeout = 3000,
        interval = 50,
      ) => {
        const end = Date.now() + timeout;
        let lastError: unknown;
        while (Date.now() < end) {
          try {
            assertion();
            return;
          } catch (error) {
            lastError = error;
            await new Promise((resolve) => setTimeout(resolve, interval));
          }
        }
        throw lastError;
      };

      await waitFor(async () => {
        routesCode = await ctx.generateRoutes();
        expect(routesCode).toContain('_mergeRouteRecord(');
      });

      ctx.stopWatcher();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('drops defineRoute merge metadata after unlinking the defining named-view file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    const waitFor = async (
      assertion: () => void | Promise<void>,
      timeout = 3000,
      interval = 50,
    ) => {
      const end = Date.now() + timeout;
      let lastError: unknown;
      while (Date.now() < end) {
        try {
          await assertion();
          return;
        } catch (error) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
      throw lastError;
    };

    try {
      const pagesDir = join(root, 'src/pages/dashboard');
      await mkdir(pagesDir, { recursive: true });

      const defaultView = join(pagesDir, 'index.tsx');
      const sidebarView = join(pagesDir, 'index@sidebar.tsx');

      await writeFile(
        defaultView,
        `import { defineRoute } from 'essor-router/experimental'
export const route = defineRoute({
  name: 'dashboard',
  meta: { requiresAuth: true },
})
export default function Dashboard(){ return null }
`,
      );

      await writeFile(
        sidebarView,
        `export default function Sidebar(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: true,
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(true);

      expect(await ctx.generateRoutes()).toContain('_mergeRouteRecord(');

      await unlink(defaultView);

      await waitFor(async () => {
        expect(await ctx.generateRoutes()).not.toContain('_mergeRouteRecord(');
      });

      ctx.stopWatcher();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps resolver and dts in sync when param parser files are added/removed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages/users');
      const paramsDir = join(root, 'src/params');
      await mkdir(pagesDir, { recursive: true });
      await mkdir(paramsDir, { recursive: true });

      await writeFile(
        join(pagesDir, '[id=uuid].tsx'),
        `export default function UserPage(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: true,
        experimental: { paramParsers: true },
      });

      const ctx = createRoutesContext(options);
      await ctx.scanPages(true);

      const dtsPath = join(root, 'typed-router.d.ts');

      expect(await ctx.generateResolver()).toContain('Parameter parser "uuid" not found');
      expect(await readFile(dtsPath, 'utf8')).not.toContain(`'uuid'`);

      const uuidParserPath = join(paramsDir, 'uuid.ts');
      await writeFile(
        uuidParserPath,
        `export const parser = {
  get(value: string) { return value },
}
`,
      );

      await waitUntil(async () => {
        const resolverCode = await ctx.generateResolver();
        const dtsCode = await readFile(dtsPath, 'utf8');
        expect(resolverCode).toContain('PARAM_PARSER__uuid');
        expect(resolverCode).not.toContain('Parameter parser "uuid" not found');
        expect(dtsCode).toContain('type Param_uuid');
        expect(dtsCode).toContain(`'uuid'`);
      });

      await unlink(uuidParserPath);

      await waitUntil(async () => {
        const resolverCode = await ctx.generateResolver();
        const dtsCode = await readFile(dtsPath, 'utf8');
        expect(resolverCode).toContain('Parameter parser "uuid" not found');
        expect(dtsCode).not.toContain(`'uuid'`);
      });

      ctx.stopWatcher();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('triggers route updates for param parser changes when dts is disabled', async () => {
    const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-e2e-'));

    try {
      const pagesDir = join(root, 'src/pages/users');
      const paramsDir = join(root, 'src/params');
      await mkdir(pagesDir, { recursive: true });
      await mkdir(paramsDir, { recursive: true });

      await writeFile(
        join(pagesDir, '[id=uuid].tsx'),
        `export default function UserPage(){ return null }
`,
      );

      const options = resolveOptions({
        root,
        routesFolder: 'src/pages',
        watch: true,
        dts: false,
        experimental: { paramParsers: true },
      });

      let routeUpdateCount = 0;
      const ctx = createRoutesContext(options);
      ctx.setServerContext({
        invalidate() {
          return false;
        },
        invalidatePage() {
          return false;
        },
        async updateRoutes() {
          routeUpdateCount++;
        },
        reload() { },
      });

      await ctx.scanPages(true);
      const baseCount = routeUpdateCount;

      const uuidParserPath = join(paramsDir, 'uuid.ts');
      await writeFile(
        uuidParserPath,
        `export const parser = {
  get(value: string) { return value },
}
`,
      );

      await waitUntil(() => {
        expect(routeUpdateCount).toBeGreaterThan(baseCount);
      });

      const afterAddCount = routeUpdateCount;
      await unlink(uuidParserPath);

      await waitUntil(() => {
        expect(routeUpdateCount).toBeGreaterThan(afterAddCount);
      });

      ctx.stopWatcher();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
