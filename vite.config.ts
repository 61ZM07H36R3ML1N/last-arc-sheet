import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json' with { type: 'json' };

import { cloudflare } from "@cloudflare/vite-plugin";

// Resolve version: CI / GitHub Actions Tag -> Local Git Tag -> package.json fallback
const getAppVersion = (): string => {
  const ref = process.env.GITHUB_REF_NAME;

  if (ref && /^v\d+\.\d+\.\d+$/.test(ref)) {
    return ref;
  }

  return `v${packageJson.version}`;
};

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    manifest: {
      name: 'Last Arc: Tactics Analogue Sheet',
      short_name: 'Last Arc Sheet',
      description: 'TTRPG Character Sheet & Live Tracker for Last Arc: Tactics Analogue',
      theme_color: '#090d16',
      background_color: '#090d16',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    }
  }), cloudflare()],
  define: {
    __APP_VERSION__: JSON.stringify(getAppVersion())
  }
});