import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Replaces the "react-app" preset that came with react-scripts. Keeps the rules that
// caught real problems during the refactor: unused variables, exhaustive hook
// dependencies, and the accessibility-adjacent JSX rules.
export default [
  { ignores: ['build/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // CRA's react-app preset reported accessibility problems as warnings. Kept at warn
      // so this migration does not have to redesign markup; Phase 4 fixes them for real.
      ...Object.fromEntries(
        Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, 'warn']),
      ),
      // The new JSX transform means React need not be in scope.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
];
