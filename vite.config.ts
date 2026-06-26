import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';
const BASE = isPagesBuild ? '/vss-platform/' : '/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'VSS Platform',
        short_name: 'VSS',
        description: 'Protected script storage for Roblox developers.',
        theme_color: '#0f0f13',
        background_color: '#0f0f13',
        display: 'standalone',
        start_url: './',
        scope: './',
      },
    }),
  ],
  server: { host: true, port: 5174 },
});
