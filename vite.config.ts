import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'suppress-vite-hmr-websocket',
        apply: 'serve',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            const inlineScript = `
    <script>
      (function() {
        if (typeof window === 'undefined') return;
        window.addEventListener('error', function(e) {
          var msg = (e && e.message) || '';
          var fn = (e && e.filename) || '';
          if (msg.indexOf('WebSocket') !== -1 || msg.indexOf('vite') !== -1 || fn.indexOf('@vite/client') !== -1) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return true;
          }
        }, true);
        window.addEventListener('unhandledrejection', function(e) {
          var msg = (e && e.reason && (e.reason.message || String(e.reason))) || '';
          if (msg.indexOf('WebSocket') !== -1 || msg.indexOf('vite') !== -1 || msg.indexOf('@vite/client') !== -1) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        }, true);
        var origErr = console.error;
        console.error = function() {
          var s = Array.prototype.slice.call(arguments).map(function(a) {
            return (a && a.message) || (a && a.stack) || String(a);
          }).join(' ');
          if (s.indexOf('WebSocket') !== -1 || s.indexOf('[vite]') !== -1 || s.indexOf('websocket') !== -1) return;
          return origErr.apply(console, arguments);
        };
        if (window.WebSocket) {
          var RealWS = window.WebSocket;
          window.WebSocket = function(url, protocols) {
            var isHmr = (protocols === 'vite-hmr') ||
                        (Array.isArray(protocols) && protocols.indexOf('vite-hmr') !== -1) ||
                        (typeof url === 'string' && (url.indexOf('vite-hmr') !== -1 || url.indexOf('token=') !== -1 || url.indexOf('@vite') !== -1));
            if (isHmr) {
              return {
                readyState: 1,
                OPEN: 1,
                CONNECTING: 0,
                CLOSING: 2,
                CLOSED: 3,
                url: url,
                protocol: 'vite-hmr',
                send: function() {},
                close: function() {},
                addEventListener: function(type, fn) {
                  if (type === 'open') setTimeout(fn, 0);
                },
                removeEventListener: function() {},
                dispatchEvent: function() { return true; }
              };
            }
            return new RealWS(url, protocols);
          };
          window.WebSocket.prototype = RealWS.prototype;
          window.WebSocket.CONNECTING = 0;
          window.WebSocket.OPEN = 1;
          window.WebSocket.CLOSING = 2;
          window.WebSocket.CLOSED = 3;
        }
      })();
    </script>`;
            return html.replace(/<head[^>]*>/i, (m) => m + inlineScript);
          },
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Bóveda Segura - Fotos, Videos y Apps',
          short_name: 'Mi Bóveda',
          description: 'Bóveda privada y cifrada con AES-GCM para almacenar fotos, videos y aplicaciones localmente.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 3000,
    },
  };
});
