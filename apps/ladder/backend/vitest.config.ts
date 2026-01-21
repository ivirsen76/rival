import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: ['dist', 'build', 'node_modules', 'src/bananas.test.ts', 'src/test/service.test.ts'],
    },
});
