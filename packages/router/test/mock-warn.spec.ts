import { mockWarn } from './utils';

describe('mock warn', () => {
  mockWarn();
  it('warns the expected message', () => {
    console.warn('This is a warning');
    expect('This is a warning').toHaveBeenWarned();
  });
  it('counts only the warnings emitted in the current test', () => {
    // The spy is cleared before each test, so the single warning emitted by the
    // previous `it` must NOT be counted here — only these three should.
    console.warn('This is a warning');
    console.warn('This is another warning');
    console.warn('This is a warning');
    console.warn('This is a warning');

    expect('This is a warning').toHaveBeenWarnedTimes(3);
  });
});
