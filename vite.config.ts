import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import solidPlugin from 'vite-plugin-solid';
// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['http://10.0.0.137:44433/data/*'],
      },
    }),
    solidPlugin(), // 🌟 必须加上这个插件，用来编译 Solid 的 JSX
  ],
});
