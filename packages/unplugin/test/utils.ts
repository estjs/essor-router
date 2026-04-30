export function mockWarn() {
  const mockFn = vi.spyOn(console, 'warn');

  expect.extend({
    toHaveBeenWarned(received) {
      const calls = mockFn.mock.calls;
      const passed = calls.some(args =>
        typeof received === 'string' ? args[0].includes(received) : received.test(args[0]),
      );

      if (passed) {
        return {
          pass: true,
          message: () => `expected not to have been warned with "${received}"`,
        };
      }

      const msgs = calls.map(args => args[0]).join('\n - ');
      return {
        pass: false,
        message: () => `expected to have been warned with "${received}", but got:\n - ${msgs}`,
      };
    },
  });
}
