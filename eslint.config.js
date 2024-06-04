import { estjs } from '@estjs/eslint-config';

export default estjs({
  unicorn: {
    'unicorn/prefer-modern-dom-apis': 'off',
    'unicorn/error-message': 'off',
    'unicorn/no-array-push-push': 'off',
  },
  javascript: {
    'unused-imports/no-unused-imports': 'off',
  },
  typescript: {
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/unified-signatures': 'off',
    '@typescript-eslint/prefer-literal-enum-member': 'off',
  },
});
