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
  const activeHistories: ReturnType<typeof createWebHistory>[] = [];

  function createTestHistory(base?: string) {
    const history = createWebHistory(base);
    activeHistories.push(history);
    return history;
  }

  const waitForNavigation = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeAll(() => {
    dom = createDom();
  });

  beforeEach(() => {
    // empty the state to simulate an initial navigation by default
    window.history.replaceState(null, '', '');
  });
  afterEach(() => {
    for (const history of activeHistories.splice(0)) {
      history.destroy();
    }

    // ensure no base element is left after a test as only the first is
    // respected
    for (const element of Array.from(document.querySelectorAll('base'))) element.remove();
  });

  afterAll(() => {
    dom.window.close();
  });

  it('handles a basic base', () => {
    expect(createTestHistory().base).toBe('');
    expect(createTestHistory('/').base).toBe('');
    expect(createTestHistory('/#').base).toBe('/#');
    expect(createTestHistory('#!').base).toBe('#!');
    expect(createTestHistory('#other').base).toBe('#other');
  });

  it('handles a base tag', () => {
    const baseEl = document.createElement('base');
    baseEl.href = '/foo/';
    document.head.append(baseEl);
    expect(createTestHistory().base).toBe('/foo');
  });

  it('handles a base tag with origin', () => {
    const baseEl = document.createElement('base');
    baseEl.href = 'https://example.com/foo/';
    document.head.append(baseEl);
    expect(createTestHistory().base).toBe('/foo');
  });

  it('handles a base tag with origin without trailing slash', () => {
    const baseEl = document.createElement('base');
    baseEl.href = 'https://example.com/bar';
    document.head.append(baseEl);
    expect(createTestHistory().base).toBe('/bar');
  });

  it('ignores base tag if base is provided', () => {
    const baseEl = document.createElement('base');
    baseEl.href = '/foo/';
    document.head.append(baseEl);
    expect(createTestHistory('/bar/').base).toBe('/bar');
  });

  it('handles a non-empty base', () => {
    expect(createTestHistory('/foo/').base).toBe('/foo');
    expect(createTestHistory('/foo').base).toBe('/foo');
  });

  it('handles a single hash base', () => {
    expect(createTestHistory('#').base).toBe('#');
    expect(createTestHistory('#/').base).toBe('#');
    expect(createTestHistory('#!/').base).toBe('#!');
    expect(createTestHistory('#other/').base).toBe('#other');
  });

  it('handles a non-empty hash base', () => {
    expect(createTestHistory('#/bar').base).toBe('#/bar');
    expect(createTestHistory('#/bar/').base).toBe('#/bar');
    expect(createTestHistory('#!/bar/').base).toBe('#!/bar');
    expect(createTestHistory('#other/bar/').base).toBe('#other/bar');
  });

  it('prepends the host to support // urls', () => {
    const history = createTestHistory();
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
      const history = createTestHistory('#');
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
      const history = createTestHistory('#something');
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
      createTestHistory('#!');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#!/foo');
      spy.mockRestore();
    });

    it('works with #other', () => {
      dom.reconfigure({ url: 'file:///usr/etc/index.html' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createTestHistory('#other');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#other/');
      spy.mockRestore();
    });

    it('works with custom#other in domain', () => {
      dom.reconfigure({ url: 'https://esm.dev/custom' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createTestHistory('custom#other');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#other/');
      spy.mockRestore();
    });

    it('works with #! and a host with initial location', () => {
      dom.reconfigure({ url: 'https://esm.dev/#!/foo' });
      const spy = vitest.spyOn(window.history, 'replaceState');
      createTestHistory('/#!');
      expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(String), '#!/foo');
      spy.mockRestore();
    });
  });

  describe('base path handling', () => {
    it('normalizes base path with trailing slash', () => {
      const history = createTestHistory('/app/');
      expect(history.base).toBe('/app');
    });

    it('normalizes base path without trailing slash', () => {
      const history = createTestHistory('/app');
      expect(history.base).toBe('/app');
    });

    it('handles empty base path', () => {
      const history = createTestHistory('');
      expect(history.base).toBe('');
    });

    it('navigates correctly with base path', () => {
      dom.reconfigure({ url: 'https://example.com/' });
      const history = createTestHistory('/app');
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
      const history = createTestHistory('/app');
      const href = history.createHref('/foo');
      expect(href).toBe('/app/foo');
    });

    it('handles base path with hash correctly', () => {
      const history = createTestHistory('#/app');
      const href = history.createHref('/foo');
      expect(href).toBe('#/app/foo');
    });

    it('handles navigation with complex base path', () => {
      dom.reconfigure({ url: 'https://example.com/' });
      const history = createTestHistory('/my/nested/app');
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
      const history = createTestHistory();
      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      history.destroy();
      addEventListenerSpy.mockRestore();
    });

    it('handles popstate events', async () => {
      const history = createTestHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Push a new state
      history.push('/foo');
      await waitForNavigation();

      // Simulate browser back button
      window.history.back();
      await waitForNavigation(50);

      expect(listener).toHaveBeenCalled();
    });

    it('restores state from popstate', async () => {
      const history = createTestHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Push with custom state
      history.push('/foo', { custom: 'data' });
      await waitForNavigation();

      // Push another state
      history.push('/bar');
      await waitForNavigation();

      // Go back
      window.history.back();
      await waitForNavigation(50);

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
    });

    it('handles navigation triggered by browser back/forward', async () => {
      const history = createTestHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Create history
      history.push('/page1');
      await waitForNavigation();
      history.push('/page2');
      await waitForNavigation();
      history.push('/page3');
      await waitForNavigation();

      listener.mockClear();

      // Go back twice
      window.history.go(-2);
      await waitForNavigation(50);

      expect(listener).toHaveBeenCalled();
      const call = listener.mock.calls[0];
      expect(call[2]).toMatchObject({
        type: 'pop',
        direction: 'back',
      });
    });

    it('suppresses consecutive go(_, false) popstate callbacks', () => {
      const originalAddEventListener = window.addEventListener.bind(window);
      let popstateHandler: ((event: { state: any }) => void) | undefined;
      const addEventListenerSpy = vitest
        .spyOn(window, 'addEventListener')
        .mockImplementation((type, listener, options) => {
          if (type === 'popstate') {
            popstateHandler = listener as (event: { state: any }) => void;
            return;
          }
          return originalAddEventListener(type, listener as any, options as any);
        });

      const history = createTestHistory();
      const listener = vitest.fn();
      history.listen(listener);

      history.push('/page1');
      const page1State = window.history.state;
      history.push('/page2');
      const page2State = window.history.state;
      history.push('/page3');

      listener.mockClear();

      const goSpy = vitest.spyOn(window.history, 'go').mockImplementation(() => {});
      history.go(-1, false);
      history.go(-1, false);

      window.history.replaceState(page2State, '', '/page2');
      popstateHandler?.({ state: page2State });

      window.history.replaceState(page1State, '', '/page1');
      popstateHandler?.({ state: page1State });

      expect(listener).not.toHaveBeenCalled();
      expect(history.location).toBe('/page1');

      goSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });

    it('removes popstate listener on destroy', () => {
      const removeEventListenerSpy = vitest.spyOn(window, 'removeEventListener');
      const history = createTestHistory();
      history.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('handles popstate with null state', async () => {
      const history = createTestHistory();
      const listener = vitest.fn();
      history.listen(listener);

      // Manually trigger popstate with null state to simulate browsers that
      // drop history.state entries.
      const event = new window.PopStateEvent('popstate', { state: null });
      expect(() => window.dispatchEvent(event)).not.toThrow();
      await waitForNavigation();

      expect(history.state).toMatchObject(
        expect.objectContaining({
          current: history.location,
          position: expect.any(Number),
        }),
      );
      expect(listener).toHaveBeenCalledWith(
        history.location,
        expect.any(String),
        expect.objectContaining({
          delta: 0,
          type: 'pop',
          direction: '',
        }),
      );
    });
  });

  describe('state management', () => {
    it('preserves state across navigation', () => {
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();

      const initialPosition = history.state.position;

      history.push('/page1');
      const afterPushPosition = history.state.position;

      expect(afterPushPosition).toBeGreaterThan(initialPosition);

      history.destroy();
    });

    it('handles state with arrays', () => {
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      const history = createTestHistory();
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
      expect(() => createTestHistory()).not.toThrow();

      replaceStateSpy.mockRestore();
    });

    it('maintains internal state consistency after errors', () => {
      const history = createTestHistory();
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
