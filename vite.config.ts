import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple custom Vite plugin to generate build assets manifest and compile sw.js
function simplePwaPlugin() {
    return {
        name: 'simple-pwa-plugin',
        closeBundle() {
            const distDir = path.resolve(__dirname, 'dist');
            if (!fs.existsSync(distDir)) return;

            const getFiles = (dir: string): string[] => {
                const results: string[] = [];
                const list = fs.readdirSync(dir);
                list.forEach((file: string) => {
                    const filePath = path.resolve(dir, file);
                    const stat = fs.statSync(filePath);
                    if (stat && stat.isDirectory()) {
                        results.push(...getFiles(filePath));
                    } else {
                        const rel = path.relative(distDir, filePath).replace(/\\/g, '/');
                        // Exclude mapping files and sw.js itself
                        if (rel !== 'sw.js' && !rel.endsWith('.map') && !rel.includes('tsconfig')) {
                            results.push('/' + rel);
                        }
                    }
                });
                return results;
            };

            const assets = getFiles(distDir);
            assets.push('/');
            assets.push('/index.html');

            const swCode = `
const CACHE_NAME = 'stardust-v1';
const ASSETS = ${JSON.stringify(assets, null, 2)};

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Background update
                fetch(e.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            return fetch(e.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                if (e.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
`;
            fs.writeFileSync(path.resolve(distDir, 'sw.js'), swCode);
            console.log('[SimplePwaPlugin] Generated sw.js with', assets.length, 'cached assets.');
        }
    };
}

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        simplePwaPlugin(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-dom') || id.includes('react/')) {
                            return 'framework';
                        }
                        if (id.includes('framer-motion')) {
                            return 'animation';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    }
});
