import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import packageJson from './package.json' with { type: 'json' };

// Resolve version: CI / GitHub Actions Tag -> Local Git Tag -> package.json fallback
const getAppVersion = (): string => {
  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }

  try {
    return execSync('git describe --tags --abbrev=0').toString().trim();
  } catch {
    return `v${packageJson.version}`;
  }
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
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
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(getAppVersion())
  }
});