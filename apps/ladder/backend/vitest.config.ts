import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: ['dist', 'node_modules', 'src/test/service.test.ts'],
    },
});
