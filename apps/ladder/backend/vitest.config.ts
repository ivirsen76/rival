import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        exclude: ['dist', 'node_modules', 'src/test/service.test.ts'],
    },
});
