import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.plugin-cache');
const CACHE_JSON = path.join(CACHE_DIR, 'index.json');
const ICON_DIR = path.join(process.cwd(), 'public', 'icons');
const CIPX_DIR = path.join(process.cwd(), 'public', 'cipx');
const README_IMAGE_DIR = path.join(process.cwd(), 'public', 'readme-images');
const README_DIR = path.join(process.cwd(), 'public', 'readmes');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function toSafePluginId(pluginId: string): string {
    return pluginId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Fetch with automatic retry and exponential backoff.
 * Retries on network errors and non-OK responses (5xx).
 */
async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    { retries = 3, baseDelay = 1000 }: { retries?: number; baseDelay?: number } = {}
): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, options);
            // Retry on server errors (5xx), but not on client errors (4xx)
            if (res.ok || res.status < 500) {
                return res;
            }
            lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
            console.warn(`[fetchWithRetry] Attempt ${attempt + 1}/${retries + 1} failed for ${url}: HTTP ${res.status}`);
        } catch (e) {
            lastError = e;
            console.warn(`[fetchWithRetry] Attempt ${attempt + 1}/${retries + 1} failed for ${url}:`, e);
        }
        if (attempt < retries) {
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

/**
 * Download and cache a plugin icon. Returns the local filename (pluginId + ext).
 */
async function cacheIcon(pluginId: string, iconUrl: string): Promise<string | null> {
    ensureDir(ICON_DIR);

    // Determine file extension from URL
    const urlPath = new URL(iconUrl).pathname;
    const ext = path.extname(urlPath) || '.png';
    // Sanitise pluginId for use as filename
    const safeId = toSafePluginId(pluginId);
    const filename = `${safeId}${ext}`;
    const filePath = path.join(ICON_DIR, filename);

    // If already cached, skip download
    if (fs.existsSync(filePath)) {
        return filename;
    }

    try {
        const res = await fetchWithRetry(iconUrl);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buf);
        return filename;
    } catch (e) {
        console.warn(`Failed to cache icon for ${pluginId}:`, e);
        return null;
    }
}

/**
 * Download and cache a plugin package (.cipx). Returns local filename.
 */
async function cacheCipx(pluginId: string, downloadUrl: string): Promise<{ filename: string | null, sizeExceeded: boolean }> {
    ensureDir(CIPX_DIR);
    const safeId = toSafePluginId(pluginId);
    const filename = `${safeId}.cipx`;
    const filePath = path.join(CIPX_DIR, filename);

    // If already cached, skip download
    if (fs.existsSync(filePath)) {
        return { filename, sizeExceeded: false };
    }

    try {
        const res = await fetchWithRetry(downloadUrl);
        if (!res.ok) return { filename: null, sizeExceeded: false };
        const contentLength = res.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 24 * 1024 * 1024) {
            console.warn(`Plugin ${pluginId} size exceeds 24MB limit, skipping cache.`);
            return { filename: null, sizeExceeded: true };
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 24 * 1024 * 1024) {
            console.warn(`Plugin ${pluginId} size exceeds 24MB limit, skipping cache.`);
            return { filename: null, sizeExceeded: true };
        }
        fs.writeFileSync(filePath, buf);
        return { filename, sizeExceeded: false };
    } catch (e) {
        console.warn(`Failed to cache cipx for ${pluginId}:`, e);
        return { filename: null, sizeExceeded: false };
    }
}

function attachCachedCipxUrls(data: unknown) {
    if (!data || typeof data !== 'object') {
        return;
    }
    const record = data as { Plugins?: Array<{ Manifest?: { Id?: string }; LocalDownloadUrl?: string }> };
    if (!record.Plugins || !Array.isArray(record.Plugins)) {
        return;
    }

    record.Plugins.forEach((plugin) => {
        const id = plugin.Manifest?.Id;
        if (!id) return;
        const filename = `${toSafePluginId(id)}.cipx`;
        const filePath = path.join(CIPX_DIR, filename);
        if (fs.existsSync(filePath)) {
            plugin.LocalDownloadUrl = `/cipx/${filename}`;
        }
    });
}

/**
 * Extract image URLs from markdown text and cache them locally.
 * Returns the modified markdown text with local image URLs.
 */
async function processReadmeImages(pluginId: string, text: string, readmeUrl: string): Promise<string> {
    ensureDir(README_IMAGE_DIR);

    let modifiedText = text;
    const imageUrls = new Set<string>();

    const mdImageRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;

    let match;
    while ((match = mdImageRegex.exec(text)) !== null) {
        if (match[1]) imageUrls.add(match[1]);
    }
    while ((match = htmlImageRegex.exec(text)) !== null) {
        if (match[1]) imageUrls.add(match[1]);
    }

    for (const originalUrl of imageUrls) {
        try {
            if (originalUrl.startsWith('data:')) continue;

            // Handle relative paths using readmeUrl as base URL
            const absoluteUrl = new URL(originalUrl, readmeUrl).href;

            const hash = crypto.createHash('md5').update(absoluteUrl).digest('hex').substring(0, 8);
            const extMatch = new URL(absoluteUrl).pathname.match(/\.[^.]+$/);
            const ext = extMatch ? extMatch[0] : '.png';
            const safeId = toSafePluginId(pluginId);
            const filename = `${safeId}_${hash}${ext}`;
            const filePath = path.join(README_IMAGE_DIR, filename);

            if (!fs.existsSync(filePath)) {
                // To avoid long hangs if remote server is slow, but we expect standard fetch to work
                const res = await fetchWithRetry(absoluteUrl);
                if (res.ok) {
                    const buf = Buffer.from(await res.arrayBuffer());
                    fs.writeFileSync(filePath, buf);
                } else {
                    console.warn(`[processReadmeImages] Failed to fetch image ${absoluteUrl}: ${res.statusText}`);
                    continue;
                }
            }

            const localUrl = `/readme-images/${filename}`;
            modifiedText = modifiedText.split(originalUrl).join(localUrl);
        } catch (e) {
            console.warn(`[processReadmeImages] Failed to process image ${originalUrl} for ${pluginId}:`, e);
        }
    }

    return modifiedText;
}

/**
 * Download and cache a plugin README markdown file.
 * Returns the local filename if successful.
 */
async function cacheReadme(pluginId: string, readmeUrl: string): Promise<string | null> {
    ensureDir(README_DIR);
    const safeId = toSafePluginId(pluginId);
    const filename = `${safeId}.md`;
    const filePath = path.join(README_DIR, filename);

    // If already cached, skip download
    if (fs.existsSync(filePath)) {
        return filename;
    }

    try {
        const res = await fetchWithRetry(readmeUrl);
        if (!res.ok) return null;
        let text = await res.text();

        text = await processReadmeImages(pluginId, text, readmeUrl);

        fs.writeFileSync(filePath, text, 'utf-8');
        return filename;
    } catch (e) {
        console.warn(`Failed to cache README for ${pluginId}:`, e);
        return null;
    }
}

export async function getPluginIndex() {
    // 1. Check if unpacked JSON cache exists and is fresh
    if (fs.existsSync(CACHE_JSON)) {
        const stats = fs.statSync(CACHE_JSON);
        const age = Date.now() - stats.mtimeMs;
        if (age < CACHE_TTL) {
            const cached = JSON.parse(fs.readFileSync(CACHE_JSON, 'utf-8'));
            attachCachedCipxUrls(cached);
            return cached;
        }
    }

    // 2. Fetch zip from remote
    const time = Math.floor(Date.now() / 1000);
    const url = `https://get.classisland.tech/d/ClassIsland-Ningbo-S3/classisland/plugin/index.zip?time=${time}`;

    let buffer: Buffer;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch plugin index zip: ${response.statusText}`);
        }
        buffer = Buffer.from(await response.arrayBuffer());
    } catch (error) {
        // Fallback to stale JSON cache if network fails
        if (fs.existsSync(CACHE_JSON)) {
            console.warn("Network error during fetch, falling back to stale cache", error);
            return JSON.parse(fs.readFileSync(CACHE_JSON, 'utf-8'));
        }
        throw error;
    }

    // 3. Unzip & parse
    const zip = new AdmZip(buffer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let indexEntry: any = zip.getEntry('index.v2.json');
    if (!indexEntry) {
        const entries = zip.getEntries();
        indexEntry = entries.find(e => e.entryName.endsWith('index.v2.json'));
    }
    if (!indexEntry) {
        throw new Error("index.v2.json not found in the downloaded archive");
    }

    const jsonString = zip.readAsText(indexEntry);
    const data = JSON.parse(jsonString);

    // 4. Resolve {root} globally
    const root = data.DownloadMirrors?.github || 'https://github.com';
    if (data.Plugins && Array.isArray(data.Plugins)) {
        const cachePromises: Promise<void>[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.Plugins.forEach((plugin: any) => {
            const originalDownloadUrl = plugin.DownloadUrl;
            if (plugin.RealIconPath) {
                plugin.RealIconPath = plugin.RealIconPath.replace('{root}', root);
            }
            if (plugin.Manifest?.Readme) {
                plugin.Manifest.Readme = plugin.Manifest.Readme.replace('{root}', root);
            }
            if (plugin.DownloadUrl) {
                plugin.DownloadUrl = plugin.DownloadUrl.replace('{root}', root);
            }

            // Cache icon
            if (plugin.RealIconPath && plugin.Manifest?.Id) {
                cachePromises.push(
                    cacheIcon(plugin.Manifest.Id, plugin.RealIconPath).then(cachedFile => {
                        if (cachedFile) {
                            plugin.CachedIconFile = cachedFile;
                        }
                    })
                );
            }

            // Cache README
            if (plugin.Manifest?.Readme && plugin.Manifest?.Id) {
                cachePromises.push(
                    cacheReadme(plugin.Manifest.Id, plugin.Manifest.Readme).then((filename) => {
                        if (filename) {
                            plugin.LocalReadmeUrl = `/readmes/${filename}`;
                        }
                    })
                );
            }

            // Cache plugin package (.cipx) for static export
            if (plugin.DownloadUrl && plugin.Manifest?.Id) {
                cachePromises.push(
                    cacheCipx(plugin.Manifest.Id, plugin.DownloadUrl).then(({ filename, sizeExceeded }) => {
                        if (filename) {
                            plugin.LocalDownloadUrl = `/cipx/${filename}`;
                        } else if (sizeExceeded && originalDownloadUrl) {
                            plugin.DownloadUrl = originalDownloadUrl.replace('{root}', 'https://github.com');
                        }
                    })
                );
            }
        });

        // Download all icons and readmes in parallel
        await Promise.allSettled(cachePromises);
    }
    // 5. Save unpacked JSON cache (not the zip!)
    ensureDir(CACHE_DIR);
    fs.writeFileSync(CACHE_JSON, JSON.stringify(data, null, 2));

    return data;
}

export async function getPluginById(id: string) {
    const data = await getPluginIndex();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin = data.Plugins.find((p: any) => p.Manifest && p.Manifest.Id === id);
    if (!plugin) return null;

    if (plugin.DownloadUrl) {
        try {
            const headRes = await fetch(plugin.DownloadUrl, { method: 'HEAD', next: { revalidate: 3600 } } as RequestInit);
            if (headRes.ok) {
                const length = headRes.headers.get('content-length');
                if (length) {
                    plugin.FileSize = parseInt(length, 10);
                }
            }
        } catch {
            console.warn("Failed to fetch file size for", plugin.Manifest.Id);
        }
    }
    return plugin;
}

/**
 * Get the absolute path of a cached icon file, or null if not found.
 */
export function getCachedIconPath(filename: string): string | null {
    const filePath = path.join(ICON_DIR, filename);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    return null;
}

/**
 * Get cached README content for a plugin, or null if not cached.
 */
export function getReadmeContent(pluginId: string): string | null {
    const safeId = toSafePluginId(pluginId);
    const filePath = path.join(README_DIR, `${safeId}.md`);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
}

// ---- Version History ----

const VERSION_CACHE_DIR = path.join(CACHE_DIR, 'versions');

export interface VersionEntry {
    version: string;
    tagName: string;
    publishedAt: string;
    body: string;
    downloadUrl?: string;
    cipxDownloadUrl?: string;
    cipxSize?: number;
    prerelease: boolean;
}

/**
 * Extract GitHub owner/repo from a GitHub URL.
 * Handles patterns like:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/releases/...
 *   https://github.com/owner/repo/raw/...
 * Returns null if not a GitHub URL or can't parse.
 */
function extractGitHubRepo(url: string): { owner: string; repo: string } | null {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (!u.hostname.includes('github.com')) return null;
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Fetch version history (GitHub Releases) for a plugin.
 * Uses DownloadUrl or Manifest.Url to determine the GitHub repo.
 * Caches results to avoid repeated API calls.
 */
export async function getPluginVersionHistory(
    pluginId: string,
    downloadUrl?: string,
    manifestUrl?: string
): Promise<VersionEntry[]> {
    ensureDir(VERSION_CACHE_DIR);
    const safeId = toSafePluginId(pluginId);
    const cacheFile = path.join(VERSION_CACHE_DIR, `${safeId}.json`);

    // Return from cache if fresh
    if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const age = Date.now() - stats.mtimeMs;
        if (age < CACHE_TTL) {
            try {
                return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
            } catch {
                // corrupted cache, refetch
            }
        }
    }

    // Determine GitHub owner/repo
    let repo = extractGitHubRepo(downloadUrl || '');
    if (!repo) {
        repo = extractGitHubRepo(manifestUrl || '');
    }
    if (!repo) {
        // Can't determine GitHub repo, return empty
        return [];
    }

    try {
        const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases?per_page=30`;
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ClassIsland-Marketplace/1.0',
        };
        // Use GitHub token if available to avoid rate limiting
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const res = await fetchWithRetry(apiUrl, { headers }, { retries: 2, baseDelay: 500 });
        if (!res.ok) {
            console.warn(`Failed to fetch releases for ${repo.owner}/${repo.repo}: HTTP ${res.status}`);
            // Return stale cache if available
            if (fs.existsSync(cacheFile)) {
                try { return JSON.parse(fs.readFileSync(cacheFile, 'utf-8')); } catch { /* empty */ }
            }
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const releases: any[] = await res.json();
        const versions: VersionEntry[] = releases.map((release) => {
            // Find the .cipx asset
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cipxAsset = release.assets?.find((a: any) =>
                a.name?.endsWith('.cipx')
            );

            return {
                version: release.name || release.tag_name || '',
                tagName: release.tag_name || '',
                publishedAt: release.published_at || release.created_at || '',
                body: release.body || '',
                downloadUrl: release.html_url || '',
                cipxDownloadUrl: cipxAsset?.browser_download_url || undefined,
                cipxSize: cipxAsset?.size || undefined,
                prerelease: release.prerelease || false,
            };
        });

        // Cache the result
        fs.writeFileSync(cacheFile, JSON.stringify(versions, null, 2), 'utf-8');
        return versions;
    } catch (e) {
        console.warn(`Failed to fetch version history for ${pluginId}:`, e);
        // Return stale cache if available
        if (fs.existsSync(cacheFile)) {
            try { return JSON.parse(fs.readFileSync(cacheFile, 'utf-8')); } catch { /* empty */ }
        }
        return [];
    }
}
