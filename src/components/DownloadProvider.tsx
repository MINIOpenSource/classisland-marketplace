'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { downloadCipxByManifest, downloadFileUrl } from '@/utils/cipxDownloader';
import { ChecksumDialog, ChecksumInfo } from './ChecksumDialog';

export interface DownloadTask {
    id: string; // unique internally, e.g. timestamp
    pluginId: string;
    pluginName: string;
    version: string;
    isManifest: boolean;
    url: string;
    progress: number;
    status: 'downloading' | 'paused' | 'error' | 'completed';
    abortController?: AbortController;
    error?: string;
    totalChunks?: number;
    completedChunks?: number;
    loadedBytes?: number;
    totalBytes?: number;
    statusText?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    manifest?: any; // For CipxChunkManifest
    speed?: string;
}

interface DownloadContextType {
    tasks: DownloadTask[];
    addTask: (pluginId: string, pluginName: string, version: string, isManifest: boolean, url: string) => void;
    pauseTask: (id: string) => void;
    resumeTask: (id: string) => void;
    cancelTask: (id: string) => void;
    removeTask: (id: string) => void;
    retryTask: (id: string) => void;
}

const DownloadContext = createContext<DownloadContextType>({
    tasks: [],
    addTask: () => { },
    pauseTask: () => { },
    resumeTask: () => { },
    cancelTask: () => { },
    removeTask: () => { },
    retryTask: () => { }
});

const TASKS_CACHE_KEY = 'cipx_download_tasks';

export function DownloadProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<DownloadTask[]>([]);
    const [checksumInfo, setChecksumInfo] = useState<ChecksumInfo | null>(null);

    // Load persisted tasks on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(TASKS_CACHE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const loaded = parsed.map((t: DownloadTask) => {
                    if (t.status === 'downloading') {
                        return { ...t, status: 'paused', error: undefined };
                    }
                    return t;
                });
                setTasks(loaded);
            }
        } catch { }
    }, []);

    // Save tasks on change
    useEffect(() => {
        try {
            // strip out abortController to serialize
            const toSave = tasks.map(t => {
                const copy = { ...t };
                delete copy.abortController;
                return copy;
            });
            localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(toSave));
        } catch { }
    }, [tasks]);

    const updateTask = (id: string, updates: Partial<DownloadTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const runTask = async (task: DownloadTask) => {
        const controller = new AbortController();
        updateTask(task.id, { status: 'downloading', abortController: controller, error: undefined, speed: undefined });

        let lastTime = Date.now();
        let lastBytes = task.loadedBytes || 0;

        try {
            const onProgress = ({ loadedBytes, totalBytes, completedChunks, totalChunks, statusText }: { loadedBytes: number, totalBytes: number, completedChunks: number, totalChunks: number, statusText?: string }) => {
                let p = 0;
                if (totalBytes > 0) {
                    p = Math.round((loadedBytes / totalBytes) * 100);
                } else if (totalChunks > 0) {
                    p = Math.round((completedChunks / totalChunks) * 100);
                }

                let speedStr;
                const now = Date.now();
                const timeDiff = now - lastTime;
                if (timeDiff > 1000) {
                    const byteDiff = loadedBytes - lastBytes;
                    const speed = byteDiff / (timeDiff / 1000);
                    if (speed > 1024 * 1024) speedStr = (speed / (1024 * 1024)).toFixed(1) + ' MB/s';
                    else if (speed > 1024) speedStr = (speed / 1024).toFixed(1) + ' KB/s';
                    else speedStr = speed.toFixed(0) + ' B/s';

                    lastTime = now;
                    lastBytes = loadedBytes;
                }

                updateTask(task.id, { progress: p, loadedBytes, totalBytes, completedChunks, totalChunks, statusText, ...(speedStr ? { speed: speedStr } : {}) });
            };

            const options = {
                fallbackFileName: `${task.pluginId}.cipx`,
                signal: controller.signal,
                onProgress,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onManifestLoaded: (manifest: any) => {
                    updateTask(task.id, { manifest });
                }
            };

            let checksumRes;
            if (task.isManifest) {
                checksumRes = await downloadCipxByManifest(task.url, options);
            } else {
                checksumRes = await downloadFileUrl(task.url, options);
            }

            updateTask(task.id, { status: 'completed', progress: 100, speed: undefined });
            setChecksumInfo(checksumRes);
        } catch (error: unknown) {
            if ((error as Error).name === 'AbortError') {
                updateTask(task.id, { status: 'paused', speed: undefined });
            } else {
                updateTask(task.id, { status: 'error', error: (error as Error).message, speed: undefined });
            }
        }
    };

    const addTask = (pluginId: string, pluginName: string, version: string, isManifest: boolean, url: string) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
        const newTask: DownloadTask = {
            id,
            pluginId,
            pluginName,
            version,
            isManifest,
            url,
            progress: 0,
            status: 'downloading'
        };
        setTasks(prev => [newTask, ...prev]);
        runTask(newTask);
    };

    const pauseTask = useCallback((id: string) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === id);
            if (task && task.status === 'downloading' && task.abortController) {
                task.abortController.abort();
            }
            return prev;
        });
    }, []);

    const resumeTask = (id: string) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === id);
            if (task && task.status === 'paused') {
                runTask(task);
            }
            return prev;
        });
    };

    const cancelTask = useCallback((id: string) => {
        pauseTask(id);
        setTasks(prev => prev.filter(t => t.id !== id));
    }, [pauseTask]);

    const removeTask = useCallback((id: string) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === id);
            if (task?.manifest?.chunks) {
                import('@/utils/chunkCache').then(({ deleteChunks }) => {
                    const baseUrl = task.url.startsWith('http') ? task.url : new URL(task.url, window.location.origin).toString();
                    const urls = task.manifest.chunks.map((c: string) => new URL(c, baseUrl).toString());
                    deleteChunks(urls);
                });
            }
            return prev.filter(t => t.id !== id);
        });
    }, []);

    const retryTask = (id: string) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === id);
            if (task && task.status === 'error') {
                runTask(task);
            }
            return prev;
        });
    };

    return (
        <DownloadContext.Provider value={{ tasks, addTask, pauseTask, resumeTask, cancelTask, removeTask, retryTask }}>
            {children}
            <ChecksumDialog info={checksumInfo} onClose={() => setChecksumInfo(null)} />
        </DownloadContext.Provider>
    );
}

export const useDownload = () => useContext(DownloadContext);
