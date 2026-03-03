import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '' prefix to load all env vars (not just VITE_-prefixed ones)
  const env = loadEnv(mode, process.cwd(), '');
  console.log('API_KEY loaded:', env.API_KEY ? `[set, ${env.API_KEY.length} chars]` : 'MISSING');

  return {
    plugins: [react(), TanStackRouterVite()],
    server: {
      proxy: {
        // All /v1 routes including WebSocket
        '/v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
          configure: (proxy) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = proxy as any;
            p.on('error', (err: Error) => {
              console.log('proxy error', err);
            });
            p.on('proxyReq', (proxyReq: { setHeader: (k: string, v: string) => void }) => {
              proxyReq.setHeader('X-API-Key', env.API_KEY);
            });
            p.on(
              'proxyReqWs',
              (proxyReq: { setHeader: (k: string, v: string) => void }, req: { url: string }) => {
                console.log('WebSocket proxy request:', req.url);
                proxyReq.setHeader('X-API-Key', env.API_KEY);
              }
            );
          },
        },
      },
    },
  };
});
