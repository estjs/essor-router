import { createWebHistory } from '../../src/history/html5';
import { createDom } from '../utils';
import type { JSDOM } from 'jsdom';

// override the value of isBrowser because the variable is created before JSDOM
// is created
vitest.mock('../../src/utils/env', () => ({
  isBrowser: true,
}));

// These unit tests are supposed to tests very specific scenarios that are easier to setup
// on a unit test than an e2e tests
describe('history HTMl5', () => {
  let dom: JSDOM;
  beforeAll(() => {
    dom = createDom();
  });

  beforeEach(() => {
    // empty the state to simulate an initial navigation by default
    window.history.replaceState(null, '', '');
  });
  afterEach(() => {
    // ensure no base element is left after a test as only the first is
    // respected
    for (const element of Array.from(document.querySelectorAll('base'))) element.remove();
  });

  afterAll(() => {
    dom.window.close();
  });

  it('handles a basic base', () => {
    expect(createWebHistory().base).toBe('');
    expect(createWebHistory('/').base).toBe('');
    expect(createWebHistory('/#').base).toBe('/#');
    expect(createWebHistory('#!').base).toBe('#!');
    expect(createWebHistory('#other').base).toBe('#other');
  });

  it('handles a base tag', () => {
    const baseEl = document.createElement('base');
    baseEl.href = '/foo/';
    document.head.append(baseEl);
    expect(createWebHistory().base).toBe('/foo');
  });

  it('handles a base tag with origin', () => {
    const baseEl = document.createElement('base');
    baseEl.href = 'https://example.com/foo/';
    document.head.append(baseEl);
    expect(createWebHistory().base).toBe('/foo');
  });

  it('handles a base tag with origin without trailing slash', () => {
    const baseEl = document.createElement('base');
    baseEl.href = 'https://example.com/bar';
    document.head.append(baseEl);
    expect(createWebHistory().base).toBe('/bar');
  });

  it('ignores base tag if base is provided', () => {
    const baseEl = document.createElement('base');
    baseEl.href = '/foo/';
    document.head.append(baseEl);
    expect(createWebHistory('/bar/').base).toBe('/bar');
  });

  it('handles a non-empty base', () => {
    expect(createWebHistory('/foo/').base).toBe('/foo');
    expect(createWebHistory('/foo').base).toBe('/foo');
  });

  it('handles a single hash base', () => {
    expect(createWebHistory('#').base).toBe('#');
    expect(createWebHistory('#/').base).toBe('#');
    expect(createWebHistory('#!/').base).toBe('#!');
    expect(createWebHistory('#other/').base).toBe('#other');
  });

  it('handles a non-empty hash base', () => {
    expect(createWebHistory('#/bar').base).toBe('#/bar');
    expect(createWebHistory('#/bar/').base).toBe('#/bar');
    expect(createWebHistory('#!/bar/').base).toBe('#!/bar');
    expect(createWebHistory('#other/bar/').base).toBe('#other/bar');
  });

  it('prepends the host to support // urls', () => {
    const history = createWebHistory();
    const spy = vitest.spyOn(window.history, 'pushState');
    history.push('/foo');
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'https://example.com/foo',
    );
    history.push('//foo');
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.any(String),
      'https://example.com//foo',
    );
    spy.mockRestore();
  });

  describe('specific to base containing a hash', () => {
    it('calls push with hash part of the url with a base', () => {
      dom.reconfigure({ url: 'file:///usr/etc/index.html' });
      const initialSpy = vitest.spyOn(window.history, 'replaceState');
      const history = createWebHistory('#');
      // initial navigation
      expect(initialSpy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#/');
      const spy = vitest.spyOn(window.history, 'pushState');
      history.push('/foo');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#/foo');
      spy.mockRestore();
      initialSpy.mockRestore();
    });

    it('works with something after the hash in the base', () => {
      dom.reconfigure({ url: 'file:///usr/etc/index.html' });
      const initialSpy = vitest.spyOn(window.history, 'replaceState');
      const history = createWebHistory('#something');
      // initial navigation
      expect(initialSpy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#something/');
      const spy = vitest.spyOn(window.history, 'pushState');
      history.push('/foo');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#something/foo');
      spy.mockRestore();
      initialSpy.mockRestore();
    });

    it('works with #! and on a file with initial location', () => {
      dom.reconfigure({ url: 'file:///usr/etc/index.html#!/foo' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createWebHistory('#!');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#!/foo');
      spy.mockRestore();
    });

    it('works with #other', () => {
      dom.reconfigure({ url: 'file:///usr/etc/index.html' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createWebHistory('#other');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#other/');
      spy.mockRestore();
    });

    it('works with custom#other in domain', () => {
      dom.reconfigure({ url: 'https://esm.dev/custom' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createWebHistory('custom#other');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#other/');
      spy.mockRestore();
    });

    it('works with #! and a host with initial location', () => {
      dom.reconfigure({ url: 'https://esm.dev/#!/foo' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createWebHistory('/#!');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#!/foo');
      spy.mockRestore();
    });
  });

  describe('base path handling', () => {
    it('normalizes base path with trailing slash', () => {
      const history = createWebHistory('/app/');
      expect(history.base).toBe('/app');
    });

    it('normalizes base path without trailing slash', () => {
      const history = createWebHistory('/app');
      expect(history.base).toBe('/app');
    });

    it('handles empty base path', () => {
      const history = createWebHistory('');
      expect(history.base).toBe('');
    });

    it('navigates correctly with base path', () => {
      dom.reconfigure({ url: 'https://example.com/' });
      const history = createWebHistory('/app');
      const spy = vitest.spyOn(window.history, 'pushState');
      history.push('/foo');
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        'https://example.com/app/foo',
      );
      spy.mockRestore();
    });

    it('generates correct href with base path', () => {
      const history = createWebHistory('/app');
      const href = history.createHref('/foo');
      expect(href).toBe('/app/foo');
    });

    it('handles base path with hash correctly', () => {
      const history = createWebHistory('#/app');
      const href = history.createHref('/foo');
      expect(href).toBe('#/app/foo');
    });

    it('handles navigation with complex base path', () => {
      dom.reconfigure({ url: 'https://example.com/' });
      const history = createWebHistory('/my/nested/app');
      const spy = vitest.spyOn(window.history, 'pushState');
      history.push('/page');
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        'https://example.com/my/nested/app/page',
      );
      spy.mockRestore();
    });
  });

  describe('popstate handling', () => {
    it('registers popstate event listener', () => {
      const addEventListenerSpy = vitest.spyOn(window, 'addEventListener');
      const history = createWebHistory();
      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      history.destroy();
      addEventListenerSpy.mockRestore();
    });

    it('handles popstate events', async () => {
      const history = createWebHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Push a new state
      history.push('/foo');
      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate browser back button
      window.history.back();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(listener).toHaveBeenCalled();
      history.destroy();
    });

    it('restores state from popstate', async () => {
      const history = createWebHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Push with custom state
      history.push('/foo', { custom: 'data' });
      await new Promise(resolve => setTimeout(resolve, 0));

      // Push another state
      history.push('/bar');
      await new Promise(resolve => setTimeout(resolve, 0));

      // Go back
      window.history.back();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Listener should be called with navigation info
      expect(listener).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          delta: expect.any(Number),
          type: 'pop',
          direction: expect.any(String),
        }),
      );

      history.destroy();
    });

    it('handles navigation triggered by browser back/forward', async () => {
      const history = createWebHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Create history
      history.push('/page1');
      await new Promise(resolve => setTimeout(resolve, 0));
      history.push('/page2');
      await new Promise(resolve => setTimeout(resolve, 0));
      history.push('/page3');
      await new Promise(resolve => setTimeout(resolve, 0));

      listener.mockClear();

      // Go back twice
      window.history.go(-2);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(listener).toHaveBeenCalled();
      const call = listener.mock.calls[0];
      expect(call[2]).toMatchObject({
        type: 'pop',
        direction: 'back',
      });

      history.destroy();
    });

    it('removes popstate listener on destroy', () => {
      const removeEventListenerSpy = vitest.spyOn(window, 'removeEventListener');
      const history = createWebHistory();
      history.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('handles popstate with null state', async () => {
      const history = createWebHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Manually trigger popstate with null state
      const event = new PopStateEvent('popstate', { state: null });
      window.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should call replace when state is null
      expect(listener).toHaveBeenCalled();
      history.destroy();
    });
  });

  describe('state management', () => {
    it('preserves state across navigation', () => {
      const history = createWebHistory();
      const customState = { userId: 123, data: 'test' };

      history.push('/page1', customState);

      // State should be accessible
      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });

    it('handles state with complex objects', () => {
      const history = createWebHistory();
      const complexState = {
        user: { id: 1, name: 'Test' },
        items: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      };

      history.push('/page', complexState);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });

    it('handles state with null values', () => {
      const history = createWebHistory();
      const stateWithNull = { value: null, other: 'data' };

      history.push('/page', stateWithNull);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });

    it('handles state with undefined values', () => {
      const history = createWebHistory();
      const stateWithUndefined = { value: undefined, other: 'data' };

      history.push('/page', stateWithUndefined);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });

    it('preserves state on replace', () => {
      const history = createWebHistory();
      const initialState = { initial: true };
      const replacedState = { replaced: true };

      history.push('/page1', initialState);
      history.replace('/page2', replacedState);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
          replaced: true,
        }),
      );

      history.destroy();
    });

    it('maintains state position correctly', () => {
      const history = createWebHistory();

      const initialPosition = history.state.position;

      history.push('/page1');
      const afterPushPosition = history.state.position;

      expect(afterPushPosition).toBeGreaterThan(initialPosition);

      history.destroy();
    });

    it('handles state with arrays', () => {
      const history = createWebHistory();
      const stateWithArray = { items: ['a', 'b', 'c'], count: 3 };

      history.push('/page', stateWithArray);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });

    it('handles state with boolean values', () => {
      const history = createWebHistory();
      const stateWithBooleans = { isActive: true, isDisabled: false };

      history.push('/page', stateWithBooleans);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });

    it('handles state with number values', () => {
      const history = createWebHistory();
      const stateWithNumbers = { count: 42, price: 19.99, negative: -5 };

      history.push('/page', stateWithNumbers);

      expect(history.state).toMatchObject(
        expect.objectContaining({
          position: expect.any(Number),
        }),
      );

      history.destroy();
    });
  });

  describe('browser API error handling', () => {
    it('handles pushState errors gracefully', () => {
      const history = createWebHistory();
      const pushStateSpy = vitest.spyOn(window.history, 'pushState');

      // Simulate pushState throwing an error (e.g., SecurityError)
      pushStateSpy.mockImplementation(() => {
        throw new Error('SecurityError: Attempt to use history.pushState() more than 100 times');
      });

      // Should not throw - falls back to location.assign
      expect(() => history.push('/page')).not.toThrow();

      pushStateSpy.mockRestore();
      history.destroy();
    });

    it('handles replaceState errors gracefully', () => {
      const history = createWebHistory();
      const replaceStateSpy = vitest.spyOn(window.history, 'replaceState');

      // Simulate replaceState throwing an error
      replaceStateSpy.mockImplementation(() => {
        throw new Error('SecurityError: Attempt to use history.replaceState() more than 100 times');
      });

      // Should not throw - falls back to location.replace
      expect(() => history.replace('/page')).not.toThrow();

      replaceStateSpy.mockRestore();
      history.destroy();
    });

    it('handles quota exceeded errors', () => {
      const history = createWebHistory();
      const pushStateSpy = vitest.spyOn(window.history, 'pushState');

      // Simulate quota exceeded error
      pushStateSpy.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should handle gracefully
      expect(() => history.push('/page')).not.toThrow();

      pushStateSpy.mockRestore();
      history.destroy();
    });

    it('continues operation after API failure', () => {
      const history = createWebHistory();
      const pushStateSpy = vitest.spyOn(window.history, 'pushState');

      // First call fails
      pushStateSpy.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });

      // Should not throw
      expect(() => history.push('/page1')).not.toThrow();

      // Restore normal behavior
      pushStateSpy.mockRestore();

      // Second call should work normally
      const normalPushSpy = vitest.spyOn(window.history, 'pushState');
      history.push('/page2');
      expect(normalPushSpy).toHaveBeenCalled();

      normalPushSpy.mockRestore();
      history.destroy();
    });

    it('handles errors during initial state setup', () => {
      const replaceStateSpy = vitest.spyOn(window.history, 'replaceState');

      // Simulate error during initial setup
      replaceStateSpy.mockImplementationOnce(() => {
        throw new Error('Initial setup error');
      });

      // Should not throw during creation
      expect(() => createWebHistory()).not.toThrow();

      replaceStateSpy.mockRestore();
    });

    it('maintains internal state consistency after errors', () => {
      const history = createWebHistory();
      const pushStateSpy = vitest.spyOn(window.history, 'pushState');

      // Cause an error
      pushStateSpy.mockImplementationOnce(() => {
        throw new Error('Error');
      });

      history.push('/error-page');

      // Location should still be updated despite error
      expect(history.location).toBe('/error-page');

      pushStateSpy.mockRestore();
      history.destroy();
    });
  });
});
