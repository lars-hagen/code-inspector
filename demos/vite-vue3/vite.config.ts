import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { CodeInspectorPlugin } from 'code-inspector-plugin';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  base: 'kk',
  plugins: [
    vue(),
    CodeInspectorPlugin({
      bundler: 'vite',
      behavior: {
        copy: '{file}',
      },
      // pathFormat: ['-g', '-r', '{file}:{line}:{column}']
    }),
    vueJsx(),
  ],
});
