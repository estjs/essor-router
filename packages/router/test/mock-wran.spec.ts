import { mockWarn } from './utils';

describe('mock warn', () => {
  mockWarn();
  it('warns the expected message', () => {
    console.warn('This is a warning');
    expect('This is a warning').toHaveBeenWarned();
  });
  it('warns the expected message exactly 3 times', () => {
    console.warn('This is a warning');
    console.warn('This is another warning');
    console.warn('This is a warning');

    expect('This is a warning').toHaveBeenWarnedTimes(3);
  });
});
