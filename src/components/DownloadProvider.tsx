'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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
}

interface DownloadContextType {
    tasks: DownloadTask[];
    addTask: (pluginId: string, pluginName: string, version: string, isManifest: boolean, url: string) => void;
    pauseTask: (id: string) => void;
    resumeTask: (id: string) => void;
    cancelTask: (id: string) => void;
    removeTask: (id: string) => void;
}

const DownloadContext = createContext<DownloadContextType>({
    tasks: [],
    addTask: () => { },
    pauseTask: () => { },
    resumeTask: () => { },
    cancelTask: () => { },
    removeTask: () => { }
});

export function DownloadProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<DownloadTask[]>([]);
    const [checksumInfo, setChecksumInfo] = useState<ChecksumInfo | null>(null);

    const updateTask = (id: string, updates: Partial<DownloadTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const runTask = async (task: DownloadTask) => {
        const controller = new AbortController();
        updateTask(task.id, { status: 'downloading', abortController: controller, error: undefined });

        try {
            const onProgress = ({ loadedBytes, totalBytes, completedChunks, totalChunks }: { loadedBytes: number, totalBytes: number, completedChunks: number, totalChunks: number }) => {
                let p = 0;
                if (totalBytes > 0) {
                    p = Math.round((loadedBytes / totalBytes) * 100);
                } else if (totalChunks > 0) {
                    p = Math.round((completedChunks / totalChunks) * 100);
                }
                updateTask(task.id, { progress: p });
            };

            const options = {
                fallbackFileName: `${task.pluginId}.cipx`,
                signal: controller.signal,
                onProgress
            };

            let checksumRes;
            if (task.isManifest) {
                checksumRes = await downloadCipxByManifest(task.url, options);
            } else {
                checksumRes = await downloadFileUrl(task.url, options);
            }

            updateTask(task.id, { status: 'completed', progress: 100 });
            setChecksumInfo(checksumRes);
        } catch (error: unknown) {
            if ((error as Error).name === 'AbortError') {
                updateTask(task.id, { status: 'paused' });
            } else {
                updateTask(task.id, { status: 'error', error: (error as Error).message });
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
        setTasks(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <DownloadContext.Provider value={{ tasks, addTask, pauseTask, resumeTask, cancelTask, removeTask }}>
            {children}
            <ChecksumDialog info={checksumInfo} onClose={() => setChecksumInfo(null)} />
        </DownloadContext.Provider>
    );
}

export const useDownload = () => useContext(DownloadContext);
