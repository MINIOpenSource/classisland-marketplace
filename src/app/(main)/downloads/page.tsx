'use client';

import { useDownload } from '@/components/DownloadProvider';
import { useTranslations } from 'next-intl';
import {
    makeStyles,
    tokens,
    Title1,
    Button,
    Text,
    ProgressBar,
    mergeClasses,
} from '@fluentui/react-components';
import { ArrowLeftRegular, PlayRegular, PauseRegular, DismissRegular, ArrowClockwiseRegular } from '@fluentui/react-icons';
import { formatBytes } from '@/components/PluginCard';
import { useRouter } from 'next/navigation';
import { useTopBar } from '@/components/TopBarProvider';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

const useStyles = makeStyles({
    container: {
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    actionButton: {
        borderRadius: '8px',
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        },
        ':active': {
            transform: 'translateY(0)',
        },
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    taskList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    card: {
        padding: '16px',
        borderRadius: tokens.borderRadiusLarge,
        backgroundColor: tokens.colorNeutralBackground1,
        boxShadow: tokens.shadow4,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    pluginInfo: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginRight: '12px',
    },
    pluginName: {
        fontSize: '18px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        flexShrink: 0,
    },
    emptyState: {
        textAlign: 'center',
        padding: '48px 16px',
        color: tokens.colorNeutralForeground3,
    }
});

export default function DownloadsPage() {
    const styles = useStyles();
    const t = useTranslations('Index');
    const router = useRouter();
    const { tasks, pauseTask, resumeTask, cancelTask, removeTask, addTask, retryTask } = useDownload();
    const { setShowBack } = useTopBar();

    const { ref: backBtnRef, inView: backBtnInView } = useInView({
        initialInView: true,
        threshold: 0,
    });

    useEffect(() => {
        setShowBack(!backBtnInView);
    }, [backBtnInView, setShowBack]);

    useEffect(() => {
        return () => setShowBack(false);
    }, [setShowBack]);

    const [isTesting, setIsTesting] = useState(false);
    const [testProgress, setTestProgress] = useState<number | null>(null);
    const [testSpeed, setTestSpeed] = useState<string | null>(null);
    const [testTime, setTestTime] = useState<string | null>(null);

    const runSpeedTest = async () => {
        setIsTesting(true);
        setTestProgress(0);
        setTestSpeed(null);
        setTestTime(null);

        try {
            const manifestRes = await fetch(`/speedtest/manifest.json?t=${Date.now()}`, { cache: 'no-store' });
            if (!manifestRes.ok) throw new Error('Speedtest manifest fetch failed');
            const manifest = await manifestRes.json();

            const chunks = manifest.chunks as string[];
            let loadedBytes = 0;
            const totalBytes = chunks.length * 192 * 1024;
            const startTime = performance.now();

            const poolLimit = chunks.length;
            let index = 0;
            const executePool = async () => {
                while (index < chunks.length) {
                    const idx = index++;
                    const res = await fetch(`${chunks[idx]}?t=${Date.now()}`, { cache: 'no-store' });
                    const buf = await res.arrayBuffer();
                    loadedBytes += buf.byteLength;
                    setTestProgress(Math.floor((loadedBytes / totalBytes) * 100));
                }
            };

            const runners: Promise<void>[] = [];
            for (let i = 0; i < poolLimit; i++) {
                runners.push(executePool());
            }
            await Promise.all(runners);

            const endTime = performance.now();
            const durationSeconds = (endTime - startTime) / 1000;
            setTestTime(durationSeconds.toFixed(2));
            setTestSpeed(formatBytes(totalBytes / durationSeconds) + '/s');
        } catch (err) {
            console.error('Speed test failed:', err);
            setTestTime('Error');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div ref={backBtnRef}>
                <Button
                    appearance="subtle"
                    icon={<ArrowLeftRegular />}
                    onClick={() => router.back()}
                    className={mergeClasses(styles.actionButton, styles.backButton)}
                >
                    {t('back') || 'Back'}
                </Button>
            </div>
            <div className={styles.headerRow}>
                <Title1>{t('downloads') || 'Downloads'}</Title1>
                <div style={{ flex: 1 }} />
                <Button
                    appearance="secondary"
                    icon={<PlayRegular />}
                    disabled={isTesting}
                    onClick={runSpeedTest}
                >
                    {t('speedTest') || 'Speed Test'}
                </Button>
            </div>

            {(isTesting || testSpeed !== null || testTime === 'Error') && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.pluginInfo}>
                            <Text weight="semibold" className={styles.pluginName}>{t('speedTest') || 'Speed Test'}</Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                {isTesting ? (t('testing') || 'Testing...') : (t('completed') || 'Completed')}
                            </Text>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <ProgressBar value={testProgress || 0} max={100} color={testTime === 'Error' ? "error" : "brand"} thickness="large" />
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {testTime === 'Error' ? (t('error') || 'Error') : `${testProgress || 0}%`}
                            {testSpeed ? ` • ${testSpeed}` : ''}
                            {testTime && testTime !== 'Error' ? ` • ${testTime}s` : ''}
                        </Text>
                    </div>
                </div>
            )}

            {tasks.length === 0 ? (
                <div className={styles.emptyState}>
                    <Text size={400}>{t('noDownloads') || 'No downloads yet'}</Text>
                </div>
            ) : (
                <div className={styles.taskList}>
                    {tasks.map(task => (
                        <div key={task.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.pluginInfo}>
                                    <Text weight="semibold" className={styles.pluginName}>{task.pluginName}</Text>
                                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{t('version') || 'Version'}: {task.version}</Text>
                                </div>
                                <div className={styles.actions}>
                                    {task.status === 'downloading' ? (
                                        <Button icon={<PauseRegular fontSize={18} />} appearance="subtle" onClick={() => pauseTask(task.id)} title={t('pause') || 'Pause'} />
                                    ) : task.status === 'paused' ? (
                                        <Button icon={<PlayRegular fontSize={18} />} appearance="subtle" onClick={() => resumeTask(task.id)} title={t('resume') || 'Resume'} />
                                    ) : task.status === 'error' ? (
                                        <Button icon={<ArrowClockwiseRegular fontSize={18} />} appearance="subtle" onClick={() => retryTask(task.id)} title={t('retry') || 'Retry'} />
                                    ) : null}
                                    <Button icon={<DismissRegular fontSize={18} />} appearance="subtle" onClick={() => {
                                        if (task.status === 'downloading' || task.status === 'paused') cancelTask(task.id);
                                        else removeTask(task.id);
                                    }} title={(task.status === 'downloading' || task.status === 'paused') ? (t('cancel') || 'Cancel') : (t('delete') || 'Delete')} />
                                </div>
                            </div>

                            {(task.status === 'downloading' || task.status === 'paused') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <ProgressBar value={task.progress} max={100} color={task.status === 'paused' ? 'warning' : 'brand'} thickness="large" />
                                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                        {task.progress}%
                                        {task.totalChunks ? ` (${task.completedChunks || 0}/${task.totalChunks})` : ''}
                                        {task.speed && task.status === 'downloading' ? ` • ${task.speed}` : ''}
                                        {task.statusText === 'merging' ? ` - ${t('downloadStatusMerging') || 'Merging...'}` : task.statusText === 'verifying' ? ` - ${t('downloadStatusVerifying') || 'Verifying...'}` : ''}
                                    </Text>
                                </div>
                            )}

                            {task.status === 'error' && <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>{t('error') || 'Error'}: {task.error}</Text>}
                            {task.status === 'completed' && (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <Text size={200} style={{ color: tokens.colorPaletteGreenForeground1 }}>{t('completed') || 'Completed'}</Text>
                                    {task.manifest && (
                                        <Button size="small" appearance="outline" onClick={() => {
                                            addTask(task.pluginId, task.pluginName, task.version, true, task.url);
                                        }}>{t('save') || 'Save'}</Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
