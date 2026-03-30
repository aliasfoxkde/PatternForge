/// <reference lib="webworker" />

const CACHE_NAME = "patternforge-v1";

const PRECACHE_URLS = ["/", "/editor", "/gallery", "/calculators", "/help", "/settings", "/about"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
		).then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	// Network-first for API/navigation, cache-first for static assets
	const url = new URL(event.request.url);

	if (url.origin === self.location.origin && /\.(js|css|svg|png|woff2?)$/.test(url.pathname)) {
		event.respondWith(
			caches.match(event.request).then(
				(cached) =>
					cached ||
					fetch(event.request)
						.then((response) => {
							if (response.ok) {
								const clone = response.clone();
								caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
							}
							return response;
						})
						.catch(() => cached),
			),
		);
		return;
	}

	// Navigation requests: network-first
	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request).catch(() => caches.match(event.request)),
		);
	}
});

export {};
