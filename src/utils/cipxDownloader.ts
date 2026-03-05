'use client';

export interface CipxChunkManifest {
    fileName: string;
    totalSize: number;
    chunkSize: number;
    chunks: string[];
}

interface DownloadProgress {
    totalChunks: number;
    completedChunks: number;
    loadedBytes: number;
    totalBytes: number;
}

interface DownloadOptions {
    fallbackFileName?: string;
    onProgress?: (progress: DownloadProgress) => void;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName || 'plugin.cipx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
}

export async function downloadCipxByManifest(manifestUrl: string, options?: DownloadOptions) {
    const manifestRes = await fetch(manifestUrl, { cache: 'no-store' });
    if (!manifestRes.ok) {
        throw new Error(`Failed to fetch chunk manifest: HTTP ${manifestRes.status}`);
    }

    const manifest = await manifestRes.json() as CipxChunkManifest;
    if (!manifest.chunks || manifest.chunks.length === 0) {
        throw new Error('Invalid chunk manifest: no chunks');
    }

    const totalChunks = manifest.chunks.length;
    let completedChunks = 0;
    let loadedBytes = 0;
    const totalBytes = manifest.totalSize || 0;

    options?.onProgress?.({
        totalChunks,
        completedChunks,
        loadedBytes,
        totalBytes,
    });

    const chunkBuffers = await Promise.all(
        manifest.chunks.map(async (chunkUrl) => {
            const url = new URL(chunkUrl, manifestUrl).toString();
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                throw new Error(`Failed to fetch chunk: HTTP ${res.status}`);
            }
            const buf = await res.arrayBuffer();
            completedChunks += 1;
            loadedBytes += buf.byteLength;
            options?.onProgress?.({
                totalChunks,
                completedChunks,
                loadedBytes,
                totalBytes: totalBytes || loadedBytes,
            });
            return buf;
        })
    );

    const blob = new Blob(chunkBuffers, { type: 'application/octet-stream' });
    triggerBrowserDownload(blob, manifest.fileName || options?.fallbackFileName || 'plugin.cipx');
}
