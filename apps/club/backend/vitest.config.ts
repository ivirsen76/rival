import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: ['dist', 'build', 'node_modules'],
        env: {
            NODE_CONFIG_DIR: path.join(__dirname, 'dist', 'config'),
        },
    },
});
