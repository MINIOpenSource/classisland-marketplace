const CACHE_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_CF_PAGES_COMMIT_SHA || 'dev';
const CACHE_NAME = `cipx-chunks-${CACHE_VERSION}`;

export async function getCache() {
    return await caches.open(CACHE_NAME);
}

export async function clearOldCaches() {
    if (typeof caches === 'undefined') return;
    try {
        const keys = await caches.keys();
        for (const key of keys) {
            if (key.startsWith('cipx-chunks-') && key !== CACHE_NAME) {
                await caches.delete(key);
            }
        }
    } catch { }
}

export async function getChunk(url: string): Promise<ArrayBuffer | null> {
    if (typeof caches === 'undefined') return null;
    try {
        const cache = await getCache();
        const res = await cache.match(url);
        if (res) return await res.arrayBuffer();
    } catch { }
    return null;
}

export async function putChunk(url: string, buffer: ArrayBuffer) {
    if (typeof caches === 'undefined') return;
    try {
        const cache = await getCache();
        await cache.put(url, new Response(buffer, { headers: { 'Content-Type': 'application/octet-stream' } }));
    } catch { }
}

export async function hasAllChunks(urls: string[]): Promise<boolean> {
    if (typeof caches === 'undefined' || urls.length === 0) return false;
    try {
        const cache = await getCache();
        for (const url of urls) {
            const match = await cache.match(url);
            if (!match) return false;
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteChunks(urls: string[]) {
    if (typeof caches === 'undefined') return;
    try {
        const cache = await getCache();
        for (const url of urls) {
            await cache.delete(url);
        }
    } catch { }
}
