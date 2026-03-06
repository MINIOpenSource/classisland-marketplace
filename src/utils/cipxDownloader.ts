'use client';

import * as SparkMD5Lib from 'spark-md5';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SparkMD5 = (SparkMD5Lib as any).default || SparkMD5Lib;

function calculateMD5(buffer: ArrayBuffer): string {
    const spark = new SparkMD5.ArrayBuffer();
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const uint8 = new Uint8Array(buffer);
    for (let i = 0; i < uint8.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, uint8.length);
        spark.append(buffer.slice(i, end));
    }
    return spark.end();
}


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

export async function downloadCipxByManifest(manifestUrl: string, options?: DownloadOptions): Promise<{ checksum: string, fileName: string }> {
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

    const combinedLength = chunkBuffers.reduce((acc, curr) => acc + curr.byteLength, 0);
    const combined = new Uint8Array(combinedLength);
    let offset = 0;
    for (const buf of chunkBuffers) {
        combined.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
    }

    const checksum = calculateMD5(combined.buffer);

    const blob = new Blob([combined], { type: 'application/octet-stream' });
    const fileName = manifest.fileName || options?.fallbackFileName || 'plugin.cipx';
    triggerBrowserDownload(blob, fileName);

    return { checksum, fileName };
}

export async function downloadFileUrl(downloadUrl: string, options?: DownloadOptions): Promise<{ checksum: string, fileName: string }> {
    const res = await fetch(downloadUrl, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`Failed to fetch file: HTTP ${res.status}`);
    }

    const totalBytes = Number(res.headers.get('content-length')) || 0;
    let loadedBytes = 0;

    let buf: ArrayBuffer;

    if (res.body) {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];

        options?.onProgress?.({
            totalChunks: 1,
            completedChunks: 0,
            loadedBytes: 0,
            totalBytes,
        });

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                chunks.push(value);
                loadedBytes += value.byteLength;
                options?.onProgress?.({
                    totalChunks: 1,
                    completedChunks: 0,
                    loadedBytes,
                    totalBytes: totalBytes || loadedBytes,
                });
            }
        }

        const combined = new Uint8Array(loadedBytes);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
        }
        buf = combined.buffer;
    } else {
        buf = await res.arrayBuffer();
        loadedBytes = buf.byteLength;
        options?.onProgress?.({
            totalChunks: 1,
            completedChunks: 1,
            loadedBytes,
            totalBytes: totalBytes || loadedBytes,
        });
    }

    const checksum = calculateMD5(buf);

    const blob = new Blob([buf], { type: 'application/octet-stream' });
    // Attempt to extract filename from URL or Content-Disposition, else fallback
    let fileName = options?.fallbackFileName || 'plugin.cipx';
    const contentDisposition = res.headers.get('content-disposition');
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
            fileName = match[1];
        }
    } else {
        try {
            const urlObj = new URL(downloadUrl);
            const pathParts = urlObj.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
                fileName = decodeURIComponent(lastPart);
            }
        } catch {
            // ignore
        }
    }

    triggerBrowserDownload(blob, fileName);

    return { checksum, fileName };
}
