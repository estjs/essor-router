import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScrollPositionStore, scrollToPosition } from '../src/core/scrollBehavior';
import { mockWarn } from './utils';

describe('scrollBehavior', () => {
  mockWarn();

  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const id = document.createElement('div');
    id.id = 'anchor';
    document.body.append(id);

    const dataEl = document.createElement('div');
    dataEl.dataset.scroll = 'true';
    document.body.append(dataEl);
  });

  beforeEach(() => {
    scrollToSpy.mockClear();
  });

  afterAll(() => {
    scrollToSpy.mockRestore();
  });

  it('scrolls to coordinate position', () => {
    scrollToPosition({ left: 10, top: 20 });
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('scrolls to element by id selector', () => {
    scrollToPosition({ el: '#anchor' });
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('scrolls to element by generic selector', () => {
    scrollToPosition({ el: '[data-scroll=true]' });
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('warns when selector cannot be resolved', () => {
    scrollToPosition({ el: '.not-found' });
    expect(`Couldn't find element using selector ".not-found"`).toHaveBeenWarned();
  });

  it('warns when selector is invalid', () => {
    scrollToPosition({ el: '#invalid[' });
    expect('The selector "#invalid[" is invalid.').toHaveBeenWarned();
  });

  it('falls back to numeric scroll when scrollBehavior is unsupported', () => {
    const originalStyle = document.documentElement.style;
    Object.defineProperty(document.documentElement, 'style', {
      value: {},
      configurable: true,
    });

    scrollToPosition({ left: 5, top: 15 });
    expect(scrollToSpy).toHaveBeenCalledWith(5, 15);

    Object.defineProperty(document.documentElement, 'style', {
      value: originalStyle,
      configurable: true,
    });
  });

  it('bounds saved scroll positions to the configured limit', () => {
    const store = createScrollPositionStore(50);

    for (let index = 0; index < 60; index++) {
      store.save(`route-${index}`, {
        left: index,
        top: index,
      });
    }

    expect(store.size).toBeLessThanOrEqual(50);
    expect(store.has('route-0')).toBe(false);
    expect(store.has('route-59')).toBe(true);
  });

  it('keeps scroll positions isolated per store instance', () => {
    const first = createScrollPositionStore();
    const second = createScrollPositionStore();

    first.save('shared-key', { left: 1, top: 2 });
    second.save('shared-key', { left: 3, top: 4 });

    expect(first.get('shared-key')).toEqual({ left: 1, top: 2 });
    expect(second.get('shared-key')).toEqual({ left: 3, top: 4 });
    expect(first.get('shared-key')).toBeUndefined();
    expect(second.get('shared-key')).toBeUndefined();
  });

  it('clearing one store does not affect another', () => {
    const first = createScrollPositionStore();
    const second = createScrollPositionStore();

    first.save('only-first', { left: 5, top: 6 });
    second.save('only-second', { left: 7, top: 8 });
    first.clear();

    expect(first.get('only-first')).toBeUndefined();
    expect(second.get('only-second')).toEqual({ left: 7, top: 8 });
  });
});
