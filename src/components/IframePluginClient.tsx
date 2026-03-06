'use client';

import {
    makeStyles,
    tokens,
    Text,
    Avatar,
    Button
} from '@fluentui/react-components';
import { ArrowDownloadRegular, StarRegular, OpenRegular, ShareRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import { PluginData, formatBytes } from './PluginCard';
import { useState, useEffect } from 'react';
import { downloadCipxByManifest, downloadFileUrl } from '@/utils/cipxDownloader';
import { ChecksumDialog, ChecksumInfo } from './ChecksumDialog';

const useStyles = makeStyles({
    container: {
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        padding: '16px',
        boxShadow: tokens.shadow4,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        color: 'inherit',
        transition: 'box-shadow 220ms ease, border-color 220ms ease',
        ':hover': {
            boxShadow: tokens.shadow8,
            border: `1px solid ${tokens.colorBrandStroke1}`
        }
    },
    topArea: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flex: 1,
    },
    leftCol: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
        minWidth: 0,
    },
    textStack: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: 1,
        minWidth: 0
    },
    title: {
        margin: 0,
        fontWeight: tokens.fontWeightSemibold,
        fontSize: '16px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    authorId: {
        color: tokens.colorNeutralForeground2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: '12px'
    },
    statsCol: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        flexShrink: 0,
        backgroundColor: tokens.colorNeutralBackground2,
        padding: '8px 12px',
        borderRadius: tokens.borderRadiusMedium,
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: tokens.colorNeutralForeground2,
        fontSize: '12px',
    },
    actionArea: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        paddingTop: '12px',
    }
});

export function IframePluginClient({ plugin }: { plugin: PluginData }) {
    const styles = useStyles();
    const t = useTranslations('Index');

    const { Manifest, DownloadCount, StarsCount, RealIconPath, CachedIconFile, FileSize } = plugin;
    const resolvedDownloadUrl = plugin.LocalDownloadUrl || plugin.DownloadUrl;

    const [fileSizeStr, setFileSizeStr] = useState<string | null>(FileSize ? formatBytes(FileSize) : null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [checksumInfo, setChecksumInfo] = useState<ChecksumInfo | null>(null);

    useEffect(() => {
        if (resolvedDownloadUrl && !fileSizeStr) {
            fetch(resolvedDownloadUrl, { method: 'HEAD' })
                .then(res => {
                    if (res.ok) {
                        const len = res.headers.get('content-length');
                        if (len) {
                            setFileSizeStr(formatBytes(parseInt(len, 10)));
                        }
                    }
                })
                .catch(() => { });
        }
    }, [resolvedDownloadUrl, fileSizeStr]);

    const iconSrc = CachedIconFile
        ? `/icons/${CachedIconFile}`
        : RealIconPath
            ? RealIconPath
            : undefined;

    const handleMarketplaceClick = () => {
        window.open(`/plugin/${Manifest.Id}`, '_blank', 'noopener,noreferrer');
    };

    const handleInstallClick = () => {
        window.location.href = `classisland://app/plugin/install?id=${Manifest.Id}`;
    };

    const handleDownloadClick = () => {
        if (plugin.LocalDownloadChunkManifest) {
            setDownloadProgress(0);
            downloadCipxByManifest(plugin.LocalDownloadChunkManifest, {
                fallbackFileName: `${Manifest.Id}.cipx`,
                onProgress: ({ loadedBytes, totalBytes, completedChunks, totalChunks }) => {
                    if (totalBytes > 0) {
                        setDownloadProgress(Math.round((loadedBytes / totalBytes) * 100));
                    } else if (totalChunks > 0) {
                        setDownloadProgress(Math.round((completedChunks / totalChunks) * 100));
                    } else {
                        setDownloadProgress(0);
                    }
                }
            }).then(res => setChecksumInfo(res)).catch(() => {
                if (resolvedDownloadUrl) {
                    setDownloadProgress(0);
                    downloadFileUrl(resolvedDownloadUrl, {
                        fallbackFileName: `${Manifest.Id}.cipx`,
                        onProgress: ({ loadedBytes, totalBytes }) => {
                            setDownloadProgress(totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : null);
                        }
                    }).then(res => setChecksumInfo(res)).catch(() => {
                        window.location.href = resolvedDownloadUrl;
                    }).finally(() => setDownloadProgress(null));
                } else {
                    setDownloadProgress(null);
                }
            }).finally(() => {
                if (!resolvedDownloadUrl) setDownloadProgress(null);
            });
            return;
        }
        if (resolvedDownloadUrl) {
            setDownloadProgress(0);
            downloadFileUrl(resolvedDownloadUrl, {
                fallbackFileName: `${Manifest.Id}.cipx`,
                onProgress: ({ loadedBytes, totalBytes }) => {
                    setDownloadProgress(totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : null);
                }
            }).then(res => setChecksumInfo(res)).catch(() => {
                window.location.href = resolvedDownloadUrl;
            }).finally(() => setDownloadProgress(null));
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.topArea}>
                <div className={styles.leftCol}>
                    <Avatar
                        image={iconSrc ? { src: iconSrc } : undefined}
                        name={Manifest.Name}
                        shape="square"
                        size={56}
                    />
                    <div className={styles.textStack}>
                        <Text as="h3" className={styles.title}>{Manifest.Name}</Text>
                        <Text className={styles.authorId}>{Manifest.Author || t('anonymous')} <span>&bull;</span> v{Manifest.Version}</Text>
                        <Text className={styles.authorId} style={{ color: tokens.colorNeutralForeground4, fontFamily: 'monospace' }}>{Manifest.Id}</Text>
                    </div>
                </div>
                <div className={styles.statsCol}>
                    <div className={styles.statItem} title={t('downloads')}>
                        <ArrowDownloadRegular fontSize={14} />
                        <Text>{DownloadCount}</Text>
                    </div>
                    <div className={styles.statItem} title={t('stars')}>
                        <StarRegular fontSize={14} />
                        <Text>{StarsCount}</Text>
                    </div>
                    <div className={styles.statItem} title="Rating">
                        <StarRegular fontSize={14} />
                        <Text>-</Text>
                    </div>
                </div>
            </div>
            <div className={styles.actionArea}>
                <Button appearance="subtle" icon={<ArrowDownloadRegular />} size="small" onClick={handleDownloadClick}>
                    {downloadProgress !== null ? `${t('download')} ${downloadProgress}%` : `${t('download')} ${fileSizeStr ? `${fileSizeStr} (.cipx)` : `(.cipx)`}`}
                </Button>
                <Button appearance="secondary" icon={<OpenRegular />} size="small" onClick={handleInstallClick}>
                    {t('installShort') || 'Install'}
                </Button>
                <Button appearance="primary" icon={<ShareRegular />} size="small" onClick={handleMarketplaceClick}>
                    {t('marketplaceShort') || 'Marketplace'}
                </Button>
            </div>

            <ChecksumDialog info={checksumInfo} onClose={() => setChecksumInfo(null)} />
        </div>
    );
}
