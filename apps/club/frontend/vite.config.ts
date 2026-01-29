import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import autoprefixer from 'autoprefixer';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
    plugins: [react(), svgr(), imagetools()],
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                additionalData: `@use 'sass:math'; @import "@/variables.scss"; @import "@/mixins.scss";`,
                silenceDeprecations: ['global-builtin', 'import', 'color-functions'],
            },
        },
        postcss: {
            plugins: [autoprefixer({})],
        },
    },
    define: {
        'process.env': {},
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        exclude: ['node_modules'],
    },
    build: {
        target: 'es2015',
        outDir: path.resolve(__dirname, '../backend/build'),
        emptyOutDir: true,
    },
});
