'use client';

import {
    makeStyles,
    tokens,
    Title1,
    Text,
    Button,
    Avatar,
    Tooltip,
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent
} from '@fluentui/react-components';
import { ArrowDownloadRegular, StarRegular, ArrowLeftRegular, OpenRegular, CopyRegular, CheckmarkRegular, CodeRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { PluginData } from './PluginCard';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { VersionHistory } from './VersionHistory';
import { useTopBar } from './TopBarProvider';
import { useInView } from 'react-intersection-observer';
import type { VersionEntry } from '@/services/pluginIndex';
import Image from 'next/image';
import { downloadCipxByManifest, downloadFileUrl } from '@/utils/cipxDownloader';
import { ChecksumDialog, ChecksumInfo } from './ChecksumDialog';

function formatBytes(bytes?: number, decimals = 2) {
    if (bytes === undefined || bytes === null || !+bytes) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// GitHub icon as inline SVG
function GitHubIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
    );
}

const useStyles = makeStyles({
    container: {
        padding: '32px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animationName: {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
        },
        animationDuration: '0.5s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
    },
    headerCard: {
        position: 'relative',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusXLarge,
        padding: '32px',
        boxShadow: tokens.shadow8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, border-color 220ms ease',
        animationName: {
            from: { opacity: 0, transform: 'translateY(16px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
        },
        animationDuration: '0.6s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
        animationDelay: '0.1s',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadow16,
            border: `1px solid ${tokens.colorBrandStroke1}`,
        }
    },
    headerInfo: {
        display: 'grid',
        gridTemplateAreas: `
            "avatar title"
            "avatar meta"
        `,
        gridTemplateColumns: 'min-content 1fr',
        gap: '8px 32px',
        alignItems: 'flex-start',
        '@media (max-width: 768px)': {
            gridTemplateAreas: `
                "avatar title"
                "meta meta"
            `,
            gap: '12px 16px',
        }
    },
    titleSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        gridArea: 'title'
    },
    metaSection: {
        display: 'flex',
        flexDirection: 'column',
        gridArea: 'meta'
    },
    headerAvatar: {
        '@media (max-width: 768px)': {
            width: '48px !important',
            height: '48px !important',
        }
    },
    pluginIdRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    statsRow: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginTop: '12px'
    },
    stat: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: tokens.colorNeutralForeground2
    },
    readme: {
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '40px',
        boxShadow: tokens.shadow4,
        borderRadius: tokens.borderRadiusXLarge,
        animationName: {
            from: { opacity: 0, transform: 'translateY(16px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
        },
        animationDuration: '0.6s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
        animationDelay: '0.2s',
        '& img': {
            maxWidth: '100%',
            borderRadius: tokens.borderRadiusMedium,
            marginTop: '16px',
            marginBottom: '16px'
        },
        '& h1': {
            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
            paddingBottom: '8px',
            marginBottom: '16px'
        },
        '& h2': {
            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
            paddingBottom: '8px',
            marginBottom: '16px'
        },
        '& p': {
            lineHeight: '1.6',
            color: tokens.colorNeutralForeground1
        },
        transition: 'box-shadow 220ms ease, border-color 220ms ease',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        '&:hover': {
            boxShadow: tokens.shadow8,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
        },
    },
    actionButtonsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        '@media (max-width: 768px)': {
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        }
    },
    actionButtonsRow: {
        display: 'flex',
        gap: '8px',
        alignItems: 'stretch',
        '@media (max-width: 768px)': {
            justifyContent: 'center',
            width: '100%',
        }
    },
    actionButton: {
        transition: 'transform 170ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 170ms ease',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: tokens.shadow8,
        },
        ':active': {
            transform: 'translateY(0)',
        }
    },
    responsiveButton: {
        borderRadius: tokens.borderRadiusLarge,
        height: '48px',
        padding: '0 24px',
        fontSize: '16px',
        fontWeight: tokens.fontWeightMedium,
        transition: 'transform 170ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 170ms ease, padding 170ms ease, width 170ms ease',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: tokens.shadow8,
        },
        ':active': {
            transform: 'translateY(0)',
        },
        '@media (max-width: 768px)': {
            minWidth: '48px',
            width: '48px',
            padding: '0',
        }
    },
    buttonText: {
        '@media (max-width: 768px)': {
            display: 'none',
        }
    },
    backButton: {
        borderRadius: tokens.borderRadiusLarge,
    },
});

export function PluginDetailClient({ plugin, readmeContent, versionHistory = [] }: { plugin: PluginData, readmeContent: string, versionHistory?: VersionEntry[] }) {
    const styles = useStyles();
    const t = useTranslations('Index');
    const router = useRouter();
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

    const [isWin, setIsWin] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setIsWin(/Win/i.test(navigator.userAgent)), 0);
        return () => clearTimeout(timer);
    }, []);
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [embedType, setEmbedType] = useState<'svg' | 'iframe'>('svg');
    const [origin, setOrigin] = useState('');
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [confirmLink, setConfirmLink] = useState<string | null>(null);
    const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
    const [checksumInfo, setChecksumInfo] = useState<ChecksumInfo | null>(null);

    const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = (e.target as HTMLElement).closest('a');
        if (target && target.href) {
            try {
                const url = new URL(target.href);
                if (url.hostname !== window.location.hostname && url.protocol.startsWith('http')) {
                    e.preventDefault();
                    setConfirmLink(target.href);
                }
            } catch {
                // Ignore invalid URLs
            }
        }
    };

    const { Manifest, DownloadCount, StarsCount, RealIconPath, FileSize, CachedIconFile } = plugin;
    const resolvedDownloadUrl = plugin.LocalDownloadUrl || plugin.DownloadUrl;

    const iconSrc = CachedIconFile
        ? `/icons/${CachedIconFile}`
        : RealIconPath
            ? RealIconPath
            : undefined;

    const handleInstall = () => {
        if (!isWin) return;
        window.location.href = `classisland://app/plugin/install?id=${Manifest.Id}`;
    };

    const handleDownload = () => {
        if (plugin.LocalDownloadChunkManifest) {
            setDownloadProgress(0);
            downloadCipxByManifest(plugin.LocalDownloadChunkManifest, {
                fallbackFileName: `${Manifest.Id}.cipx`,
                onProgress: ({ completedChunks, totalChunks, loadedBytes, totalBytes }) => {
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
                    }).finally(() => {
                        setDownloadProgress(null);
                    });
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
            }).finally(() => {
                setDownloadProgress(null);
            });
        }
    };

    const handleOpenGitHub = () => {
        if (Manifest.Url) {
            window.open(Manifest.Url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(Manifest.Id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const escapedEmbedAlt = Manifest.Name.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const svgCardUrl = `${origin}/svg/plugin/${Manifest.Id}`;
    const iframeCardUrl = `${origin}/iframe/plugin/${Manifest.Id}`;
    const svgEmbedCode = `<img src="${svgCardUrl}" alt="${escapedEmbedAlt}" width="400" height="100" style="border-radius: 8px; max-width: 100%; height: auto;" />`;
    const iframeEmbedCode = `<iframe src="${iframeCardUrl}" width="400" height="180" frameborder="0" style="border-radius: 8px; overflow: hidden; max-width: 100%;"></iframe>`;
    const embedCode = embedType === 'svg' ? svgEmbedCode : iframeEmbedCode;

    const handleCopyEmbed = () => {
        navigator.clipboard.writeText(embedCode).then(() => {
            setEmbedCopied(true);
            setTimeout(() => setEmbedCopied(false), 2000);
        });
    };

    const sizeStr = formatBytes(FileSize);
    const transitionId = Manifest.Id.replace(/[^a-zA-Z0-9]/g, '-');

    return (
        <div className={styles.container}>
            {/* Back button placed above the card */}
            <div ref={backBtnRef}>
                <Button
                    appearance="subtle"
                    icon={<ArrowLeftRegular />}
                    onClick={() => router.back()}
                    className={`${styles.actionButton} ${styles.backButton}`}
                >
                    {t('back')}
                </Button>
            </div>

            <div className={styles.headerCard} style={{ viewTransitionName: `card-box-${transitionId}` } as React.CSSProperties}>
                <div className={styles.headerInfo}>
                    <div style={{ viewTransitionName: `avatar-img-${transitionId}`, gridArea: 'avatar' } as React.CSSProperties}>
                        <Avatar
                            image={iconSrc ? { src: iconSrc } : undefined}
                            name={Manifest.Name}
                            shape="square"
                            size={96}
                            className={styles.headerAvatar}
                        />
                    </div>
                    <div className={styles.titleSection}>
                        <Title1 as="h1" style={{ margin: 0, fontWeight: tokens.fontWeightBold, display: 'inline-block', viewTransitionName: `title-text-${transitionId}` } as React.CSSProperties}>{Manifest.Name}</Title1>
                        <Text size={500} style={{ color: tokens.colorNeutralForeground2 }}>
                            {Manifest.Author || t('anonymous')} • {t('version')} {Manifest.Version}
                        </Text>
                    </div>
                    <div className={styles.metaSection}>
                        <div className={styles.pluginIdRow}>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground4, fontFamily: 'monospace' }}>
                                {Manifest.Id}
                            </Text>
                            <Tooltip content={copied ? t('copied') : t('copyId')} relationship="label">
                                <Button
                                    appearance="subtle"
                                    size="small"
                                    icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
                                    onClick={handleCopyId}
                                    className={styles.actionButton}
                                    style={{ minWidth: 'auto', padding: '2px', height: 'auto' }}
                                />
                            </Tooltip>
                        </div>
                        <div className={styles.statsRow}>
                            <div className={styles.stat} title={t('downloads')}>
                                <ArrowDownloadRegular fontSize={24} />
                                <Text size={400}>{DownloadCount}</Text>
                            </div>
                            <div className={styles.stat} title={t('stars')}>
                                <StarRegular fontSize={24} />
                                <Text size={400}>{StarsCount}</Text>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.actionButtonsContainer}>
                    <div className={styles.actionButtonsRow}>
                        <Button
                            appearance={isWin ? "primary" : "secondary"}
                            disabled={!isWin}
                            size="large"
                            icon={<OpenRegular />}
                            onClick={handleInstall}
                            title={!isWin ? t('requiresWindows') : ""}
                            className={styles.responsiveButton}
                        >
                            <span className={styles.buttonText}>{t('install')}</span>
                        </Button>
                        <Tooltip content={`${t('download')} (.cipx)${sizeStr ? ` - ${sizeStr}` : ''}`} relationship="label">
                            <Button
                                appearance="outline"
                                size="large"
                                icon={<ArrowDownloadRegular />}
                                onClick={handleDownload}
                                className={styles.responsiveButton}
                            >
                                <span className={styles.buttonText}>{t('download')}</span>
                            </Button>
                        </Tooltip>
                        {Manifest.Url && (
                            <Tooltip content={t('openInGitHub')} relationship="label">
                                <Button
                                    appearance="outline"
                                    size="large"
                                    icon={<GitHubIcon />}
                                    onClick={handleOpenGitHub}
                                    className={styles.responsiveButton}
                                >
                                    <span className={styles.buttonText}>{t('openInGitHub') || 'GitHub'}</span>
                                </Button>
                            </Tooltip>
                        )}
                        <Tooltip content={t('embedCard') || 'Embed Card'} relationship="label">
                            <Button
                                appearance="outline"
                                size="large"
                                icon={<CodeRegular />}
                                onClick={() => {
                                    setOrigin(window.location.origin);
                                    setEmbedDialogOpen(true);
                                }}
                                className={styles.responsiveButton}
                            >
                                <span className={styles.buttonText}>{t('embedCard') || 'Embed Card'}</span>
                            </Button>
                        </Tooltip>
                    </div>
                    {!isWin && <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>{t('requiresWindows')}</Text>}
                    {downloadProgress !== null && (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {`${t('download')} ${downloadProgress}%`}
                        </Text>
                    )}
                </div>
            </div>

            {versionHistory.length > 0 && (
                <VersionHistory versions={versionHistory} currentVersion={Manifest.Version} />
            )}

            <div className={styles.readme} style={{ padding: 0, overflow: 'hidden' }} onClick={handleLinkClick}>
                {readmeContent ? (
                    <MarkdownPreview
                        source={readmeContent}
                        style={{ padding: '40px', backgroundColor: 'transparent' }}
                    />
                ) : (
                    <div style={{ padding: '40px' }}>
                        <Text size={400}>{Manifest.Description || "No readme available."}</Text>
                    </div>
                )}
            </div>

            <Dialog open={confirmLink !== null} onOpenChange={(_, data) => !data.open && setConfirmLink(null)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>{t('externalLinkWarningTitle')}</DialogTitle>
                        <DialogContent>
                            <Text>{t('externalLinkWarningContent')}</Text>
                            <br /><br />
                            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium }}>
                                {confirmLink}
                            </div>
                            <br />
                            <Text>{t('externalLinkWarningConfirm')}</Text>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => setConfirmLink(null)}>{t('cancel')}</Button>
                            <Button appearance="primary" onClick={() => {
                                if (confirmLink) {
                                    window.open(confirmLink, '_blank', 'noopener,noreferrer');
                                    setConfirmLink(null);
                                }
                            }}>{t('confirm')}</Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            <Dialog open={embedDialogOpen} onOpenChange={(_, data) => setEmbedDialogOpen(data.open)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>{t('embedCardTitle') || 'Embed Plugin Card'}</DialogTitle>
                        <DialogContent>
                            <Text>{t('embedCardDesc') || 'Copy the HTML snippet below to embed this plugin card in your README or website.'}</Text>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                <Button
                                    size="small"
                                    appearance={embedType === 'svg' ? 'primary' : 'secondary'}
                                    onClick={() => {
                                        setEmbedType('svg');
                                        setEmbedCopied(false);
                                    }}
                                >
                                    {t('embedCardTypeSvg')}
                                </Button>
                                <Button
                                    size="small"
                                    appearance={embedType === 'iframe' ? 'primary' : 'secondary'}
                                    onClick={() => {
                                        setEmbedType('iframe');
                                        setEmbedCopied(false);
                                    }}
                                >
                                    {t('embedCardTypeIframe')}
                                </Button>
                            </div>
                            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                                {embedType === 'svg' ? (
                                    <>
                                        <Image
                                            src={`/svg/plugin/${Manifest.Id}`}
                                            alt={Manifest.Name}
                                            width={400}
                                            height={180}
                                            unoptimized
                                            style={{ borderRadius: '8px', overflow: 'hidden', objectFit: 'cover', width: '100%', height: 'auto' }}
                                        />
                                        <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '8px', display: 'block' }}>
                                            {t('embedCardClickHint')}
                                        </Text>
                                    </>
                                ) : (
                                    <iframe
                                        src={`/iframe/plugin/${Manifest.Id}`}
                                        width="100%"
                                        height="180"
                                        frameBorder="0"
                                        style={{ borderRadius: '8px', overflow: 'hidden' }}
                                    />
                                )}
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: tokens.colorNeutralBackground2,
                                padding: '8px 12px',
                                borderRadius: tokens.borderRadiusMedium,
                                gap: '8px'
                            }}>
                                <code style={{
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    wordBreak: 'break-all',
                                    whiteSpace: 'pre-wrap',
                                    color: tokens.colorNeutralForeground1
                                }}>
                                    {embedCode}
                                </code>
                                <Button
                                    appearance="subtle"
                                    icon={embedCopied ? <CheckmarkRegular /> : <CopyRegular />}
                                    onClick={handleCopyEmbed}
                                    style={{ flexShrink: 0 }}
                                />
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => setEmbedDialogOpen(false)}>{t('close') || 'Close'}</Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            <ChecksumDialog info={checksumInfo} onClose={() => setChecksumInfo(null)} />
        </div>
    );
}
