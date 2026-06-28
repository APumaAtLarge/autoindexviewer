import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import solidPlugin from 'vite-plugin-solid';
// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['http://10.0.0.137:44433/*'],
       
      }
    }),
    solidPlugin(), // 🌟 必须加上这个插件，用来编译 Solid 的 JSX
  ], server: {
    host: '0.0.0.0', // 核心配置：监听所有 IP 地址
    port: 5176,      // 核心配置：固定端口号为 5176
    strictPort: true // 推荐开启：如果 5176 端口被占用，直接报错退出了，而不是自动换成 5177
    ,// 👇 加上这一行，允许你的自定义域名访问
    allowedHosts: ['monkey.rainbowgem.dpdns.org']
  }
});
