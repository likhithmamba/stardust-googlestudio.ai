// src/pwa/registration.ts — Service Worker Lifecycle & Update Detection

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('[SW] ServiceWorker registered with scope:', registration.scope);

                    // Check for updates on load and periodically (every 15 minutes)
                    registration.update();
                    setInterval(() => {
                        registration.update().catch((e) => console.warn('[SW] Update check failed', e));
                    }, 15 * 60 * 1000);

                    // Detect when a new service worker is installing or waiting
                    const listenToStateChange = (worker: ServiceWorker) => {
                        worker.addEventListener('statechange', () => {
                            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[SW] New content available; prompt user to reload.');
                                window.dispatchEvent(new CustomEvent('stardust:sw-update', {
                                    detail: { registration }
                                }));
                            }
                        });
                    };

                    if (registration.waiting) {
                        console.log('[SW] A new worker is already waiting.');
                        window.dispatchEvent(new CustomEvent('stardust:sw-update', {
                            detail: { registration }
                        }));
                    }

                    if (registration.installing) {
                        listenToStateChange(registration.installing);
                    }

                    registration.addEventListener('updatefound', () => {
                        if (registration.installing) {
                            listenToStateChange(registration.installing);
                        }
                    });
                })
                .catch((err) => {
                    console.error('[SW] ServiceWorker registration failed:', err);
                });
        });

        // Handle controller change (reloading when new SW claims control)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('[SW] Controller changed. Reloading page...');
                window.location.reload();
            }
        });
    }
}
