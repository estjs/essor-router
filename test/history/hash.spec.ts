import { createDom, mockWarn } from '../utils';
import { createWebHashHistory } from '../../src/history/hash';
import { createWebHistory } from '../../src/history/html5';
import type { JSDOM } from 'jsdom';

vitest.mock('../../src/history/html5');
// override the value of isBrowser because the variable is created before JSDOM
// is created
vitest.mock('../../src/utils/env', () => ({
  isBrowser: true,
}));

describe('history Hash', () => {
  let dom: JSDOM;
  beforeAll(() => {
    dom = createDom();
  });
  mockWarn();

  beforeEach(() => {
    (createWebHistory as any).mockClear();
  });

  afterEach(() => {
    // ensure no base element is left after a test as only the first is
    // respected
    for (const element of Array.from(document.querySelectorAll('base'))) element.remove();
  });

  afterAll(() => {
    dom.window.close();
  });

  describe('url', () => {
    beforeEach(() => {
      dom.reconfigure({ url: 'https://example.com' });
    });

    it('should use a correct base', () => {
      dom.reconfigure({ url: 'https://esm.dev' });
      createWebHashHistory();
      // starts with a `/`
      expect(createWebHistory).toHaveBeenCalledWith('/#');
    });

    it('should be able to provide a base', () => {
      createWebHashHistory('/folder/');
      expect(createWebHistory).toHaveBeenCalledWith('/folder/#');
    });

    it('should be able to provide a base with no trailing slash', () => {
      createWebHashHistory('/folder');
      expect(createWebHistory).toHaveBeenCalledWith('/folder#');
    });

    it('should use the base option over the base tag', () => {
      const baseEl = document.createElement('base');
      baseEl.href = '/foo/';
      document.head.append(baseEl);
      createWebHashHistory('/bar/');
      expect(createWebHistory).toHaveBeenCalledWith('/bar/#');
    });

    describe('url with pathname', () => {
      it('keeps the pathname as base', () => {
        dom.reconfigure({ url: 'https://esm.dev/subfolder' });
        createWebHashHistory();
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder#');
      });

      it('keeps the pathname without a trailing slash as base', () => {
        dom.reconfigure({ url: 'https://esm.dev/subfolder#/foo' });
        createWebHashHistory();
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder#');
      });

      it('keeps the pathname with trailing slash as base', () => {
        dom.reconfigure({ url: 'https://esm.dev/subfolder/#/foo' });
        createWebHashHistory();
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder/#');
      });
    });
  });

  describe('file://', () => {
    beforeEach(() => {
      dom.reconfigure({ url: 'file:///usr/some-file.html' });
    });

    it('should use a correct base', () => {
      createWebHashHistory();
      // both, a trailing / and none work
      expect(createWebHistory).toHaveBeenCalledWith('#');
    });
  });
});
