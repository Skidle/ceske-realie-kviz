import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Replaces the "react-app" preset that came with react-scripts. Keeps the rules that
// caught real problems during the refactor: unused variables, exhaustive hook
// dependencies, and the accessibility-adjacent JSX rules.
export default [
  { ignores: ['build/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
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
      // Accessibility problems are errors now that they are all fixed. CRA reported them
      // as warnings, which is how they went unnoticed.
      //
      // Two rules stay off, and neither hides a real problem:
      // - label-has-for is deprecated upstream and demands both nesting AND htmlFor,
      //   which contradicts label-has-associated-control. That rule is on and passing.
      // - control-has-associated-label cannot resolve a label that points at a control
      //   by htmlFor, so it reports inputs that are correctly labelled.
      'jsx-a11y/label-has-for': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      // The new JSX transform means React need not be in scope.
      'react/react-in-jsx-scope': 'off',
      // TypeScript checks prop types now.
      'react/prop-types': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx,mjs}', 'src/setupTests.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  {
    // Build-time tooling: runs in Node, never shipped to the browser.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off', 'no-await-in-loop': 'off' },
  },
];
