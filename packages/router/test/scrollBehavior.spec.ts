import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveScrollPosition, scrollPositions, scrollToPosition } from '../src/scrollBehavior';
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
    scrollPositions.clear();

    for (let index = 0; index < 60; index++) {
      saveScrollPosition(`route-${index}`, {
        left: index,
        top: index,
      });
    }

    expect(scrollPositions.size).toBeLessThanOrEqual(50);
    expect(scrollPositions.has('route-0')).toBe(false);
    expect(scrollPositions.has('route-59')).toBe(true);
  });
});
