import js from '@eslint/js';
import node from 'eslint-plugin-n';          // Node.js 용
import globals from 'globals';

export default [
  js.configs.recommended,
  node.configs['flat/recommended'],          // eslint-plugin-n preset
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',                 // CommonJS 예시
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'callback-return': 'error',
      'handle-callback-err': 'error',
    },
  },
];
