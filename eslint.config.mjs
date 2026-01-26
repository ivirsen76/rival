import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    { ignores: ['**/dist/**', '**/build/**', '**/avataaars/**', '**/metronic/**'] },
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                React: 'readonly',
                ...globals.browser,
                ...globals.node,
                ...globals.vitest,
            },
        },
        rules: {
            // Remove this block when all TS files will be checked
            'no-undef': 'error',
            'no-unused-vars': ['error', { args: 'none' }],
            'no-redeclare': 'error',
            'no-use-before-define': ['error', { functions: false }],

            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-refresh/only-export-components': 'off',
        },
    },
]);
