import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/client/index.ts'],
      formats: ['umd'],
      fileName: 'client',
      name: 'codeInspectorClient',
    },
    minify: true,
    emptyOutDir: false,
    target: ['node8', 'es2015'],
  },
  plugins: [
    // @ts-ignore
    terser({
      format: {
        comments: false
      }
    })
  ],
});
