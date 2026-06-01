import { describe, expect, it, vi } from 'vitest';
import { createViteContext } from '../../src/core/vite';
import {
  DEFINE_PAGE_QUERY_RE,
  MODULE_RESOLVER_PATH,
  MODULE_ROUTES_PATH,
  asVirtualId,
  getVirtualId,
} from '../../src/core/moduleConstants';

describe('vite context helpers', () => {
  it('wraps invalidate and updateRoutes for module graph', async () => {
    const reloadModule = vi.fn().mockResolvedValue(undefined);
    const moduleGraph = {
      getModuleById: vi.fn(),
      getModulesByFile: vi.fn(),
    };
    const ws = { send: vi.fn() };
    const server = { moduleGraph, reloadModule, ws } as any;

    const ctx = createViteContext(server);

    moduleGraph.getModuleById.mockReturnValueOnce(null);
    expect(ctx.invalidate('missing')).toBe(false);

    const fakeModule = { id: 'test' };
    moduleGraph.getModuleById.mockReturnValueOnce(fakeModule);
    await ctx.invalidate('test');
    expect(reloadModule).toHaveBeenCalledWith(fakeModule);
    expect(reloadModule).toHaveBeenCalledTimes(1);

    const fileModules = new Set([fakeModule, { id: 'other' }]);
    moduleGraph.getModulesByFile.mockReturnValueOnce(fileModules);
    await ctx.invalidatePage('/abs/pages/home.tsx');
    expect(reloadModule).toHaveBeenCalledTimes(3);

    moduleGraph.getModuleById.mockImplementation((id) => ({ id }));
    await ctx.updateRoutes();
    expect(moduleGraph.getModuleById).toHaveBeenCalledWith(asVirtualId(MODULE_ROUTES_PATH));
    expect(moduleGraph.getModuleById).toHaveBeenCalledWith(asVirtualId(MODULE_RESOLVER_PATH));
    expect(reloadModule).toHaveBeenCalledTimes(5);
  });

  it('triggers full reload', () => {
    const server = {
      moduleGraph: {
        getModuleById: vi.fn(),
        getModulesByFile: vi.fn(),
      },
      reloadModule: vi.fn(),
      ws: { send: vi.fn() },
    } as any;

    const ctx = createViteContext(server);
    ctx.reload();
    expect(server.ws.send).toHaveBeenCalledWith({
      type: 'full-reload',
      path: '*',
    });
  });
});

describe('module constants', () => {
  it('virtual id helpers roundtrip', () => {
    const virtual = asVirtualId('essor-router/auto-routes');
    expect(getVirtualId(virtual)).toBe('essor-router/auto-routes');
    expect(getVirtualId('normal-id')).toBeNull();
  });

  it('matches definePage query pattern', () => {
    expect(DEFINE_PAGE_QUERY_RE.test('file.tsx?definePage')).toBe(true);
    expect(DEFINE_PAGE_QUERY_RE.test('file.tsx?other=1')).toBe(false);
  });
});
