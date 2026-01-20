import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import autoprefixer from 'autoprefixer';
import { imagetools } from 'vite-imagetools';

// https://vite.dev/config/
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
    build: {
        target: 'es2015',
    },
});
