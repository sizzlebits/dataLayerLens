import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import noHardcodedColors from './eslint-rules/no-hardcoded-colors.js';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'custom': {
        rules: {
          'no-hardcoded-colors': noHardcodedColors,
        },
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'custom/no-hardcoded-colors': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.js'],
  }
);
