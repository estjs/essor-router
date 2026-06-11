import { estjs } from '@estjs/eslint-config';

export default estjs(
  {
    unicorn: {
      'unicorn/prefer-modern-dom-apis': 'off',
      'unicorn/error-message': 'off',
      'unicorn/no-array-push-push': 'off',
      'unused-imports/no-unused-vars': 'off',
    },

    typescript: {
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/prefer-literal-enum-member': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
    test: {
      'vitest/expect-expect': 'off',
    },
    ignores: ['dist', 'doc_build', 'docs', 'test-results'],
  },
  {
    react: false,
    unocss: false,
  },
);
