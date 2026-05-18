'use client';
import Link from 'next/link';

import {
    Card,
    CardHeader,
    CardFooter,
    Text,
    Avatar,
    Button,
    makeStyles,
    mergeClasses,
    tokens,
    useToastController,
    Toast,
    ToastTitle,
    ToastBody,
    Spinner
} from '@fluentui/react-components';
import { ArrowDownloadRegular, StarRegular, OpenRegular, CopyRegular, CheckmarkRegular, ShareRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';

import { useInView } from 'react-intersection-observer';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { downloadCipxByManifest, downloadFileUrl } from '@/utils/cipxDownloader';
import { ChecksumDialog, ChecksumInfo } from './ChecksumDialog';
import Tilt from 'react-parallax-tilt';

export function formatBytes(bytes?: number, decimals = 2) {
    if (bytes === undefined || bytes === null || !+bytes) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const useStyles = makeStyles({
    cardWrapper: {
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
        '&:hover': {
            zIndex: 800,
        },
    },
    cardWrapperVisible: {
        opacity: 1,
        transform: 'translateY(0)',
    },
    cardWrapperHovering: {
        zIndex: 800,
    },
    cardWrapperTouchExpanded: {
        zIndex: 801,
        '@media (max-width: 700px)': {
            height: 'auto',
        }
    },
    card: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        minHeight: '100%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusXLarge,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        overflow: 'hidden',
        transformOrigin: 'center center',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow: tokens.shadow4,
        '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0,
            background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.08), rgba(34, 197, 94, 0.05) 44%, transparent 70%)',
            transition: 'opacity 0.25s ease',
        },
        '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0,
            background: 'radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08) 24%, transparent 58%)',
            transition: 'opacity 0.18s ease',
            zIndex: 1,
        },
        '&:hover': {
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${tokens.colorBrandStroke1}`,
            '&::before': {
                opacity: 1,
            },
            '&::after': {
                opacity: 1,
            }
        },
        '@media (max-width: 700px)': {
            '&:hover': {
                transform: 'translateY(-4px)',
            }
        },
        '&:focus-within': {
            border: `1px solid ${tokens.colorBrandStroke1}`,
            boxShadow: tokens.shadow16,
        },
    },
    description: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: tokens.colorNeutralForeground2,
        marginTop: '8px',
        display: 'block',
    },
    truncate: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
    },
    statsRow: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginTop: '8px'
    },
    stat: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: tokens.colorNeutralForeground3
    },
    hoverInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: tokens.borderRadiusLarge,
        backgroundColor: tokens.colorNeutralBackground1,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    hoverInfoHidden: {
        maxHeight: '0',
        padding: '0 10px 0 10px',
        marginTop: '0px',
        opacity: 0,
        border: `1px solid transparent`,
        boxShadow: 'none',
        pointerEvents: 'none',
    },
    hoverInfoVisible: {
        maxHeight: '260px',
        padding: '10px 10px 8px 10px',
        marginTop: '8px',
        opacity: 1,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        boxShadow: tokens.shadow8,
        pointerEvents: 'auto',
    },
    hoverDescription: {
        color: tokens.colorNeutralForeground2,
        fontSize: '12px',
        lineHeight: '16px',
        margin: 0,
        whiteSpace: 'normal',
        overflowY: 'auto',
        maxHeight: '180px',
    },
    hoverIdRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginTop: '8px',
    },
    hoverId: {
        display: 'block',
        color: tokens.colorNeutralForeground3,
        fontSize: '11px',
        lineHeight: '14px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        flexGrow: 1,
    },
    copyButton: {
        minWidth: '26px',
        width: '26px',
        height: '26px',
        padding: 0,
        borderRadius: tokens.borderRadiusMedium,
    },
    hoverOpenIcon: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        width: '20px',
        height: '20px',
        zIndex: 4,
        color: tokens.colorNeutralForeground3,
        pointerEvents: 'none',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    hoverOpenIconHidden: {
        opacity: 0,
        transform: 'scale(0.8)',
    },
    hoverOpenIconVisible: {
        opacity: 1,
        transform: 'scale(1)',
    },
    actionButton: {
        transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms ease',
        '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: tokens.shadow8,
        },
        '&:active': {
            transform: 'translateY(0)',
        }
    },
    installButton: {
        borderRadius: tokens.borderRadiusLarge,
        fontWeight: tokens.fontWeightSemibold,
    },
    downloadButton: {
        borderRadius: tokens.borderRadiusLarge,
    },
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 800,
        opacity: 0,
        transition: 'opacity 0.25s ease',
        pointerEvents: 'none',
        '@media (max-width: 700px)': {
            display: 'none'
        }
    },
    overlayVisible: {
        opacity: 1,
        pointerEvents: 'auto',
    },
    cardTouchExpanded: {
        transform: 'scale(1.03) !important',
        boxShadow: `0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 10px 20px -5px rgba(0, 0, 0, 0.1) !important`,
        border: `1px solid ${tokens.colorBrandStroke1} !important`,
        '@media (max-width: 700px)': {
            position: 'relative',
            transform: 'scale(1.02) !important',
        }
    }
});

export interface PluginData {
    DownloadUrl: string;
    LocalDownloadUrl?: string;
    LocalDownloadChunkManifest?: string;
    LocalReadmeUrl?: string;
    DownloadCount: number;
    StarsCount: number;
    Rating?: number;
    RatingCount?: number;
    FileSize?: number;
    CachedIconFile?: string;
    CachedIconFileMin?: string;
    Manifest: {
        Id: string;
        Name: string;
        Version: string;
        Description: string;
        Author: string;
        Url?: string;
        Readme?: string;
    };
    RealIconPath?: string;
}

export function PluginCard({ plugin, index = 0 }: { plugin: PluginData; index?: number }) {
    const styles = useStyles();
    const t = useTranslations('Index');
    const router = useRouter();
    const { ref, inView } = useInView({ rootMargin: '350px 0px', triggerOnce: true });
    const [isWin, setIsWin] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setIsWin(/Win/i.test(navigator.userAgent)), 0);
        return () => clearTimeout(timer);
    }, []);
    const fileSizeStr = plugin.FileSize ? formatBytes(plugin.FileSize) : null;
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [copied, setCopied] = useState(false);
    const [baseHeight, setBaseHeight] = useState<number | null>(null);
    const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const resolvedDownloadUrl = plugin.LocalDownloadUrl || plugin.DownloadUrl;
    const [isNavigating, setIsNavigating] = useState(false);
    const pathname = usePathname();
    const [checksumInfo, setChecksumInfo] = useState<ChecksumInfo | null>(null);
    const [isTouchExpanded, setIsTouchExpanded] = useState(false);
    const { dispatchToast } = useToastController('global-toaster');

    // Use an early return equivalent effect to clear state asynchronously to avoid setting state during render
    useEffect(() => {
        let isMounted = true;

        // Reset navigation state when pathname changes (meaning navigation completed)
        const timeout = setTimeout(() => {
            if (isMounted) setIsNavigating(false);
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [pathname]);

    useEffect(() => {
        if (inView) {
            // Cap the staggered delay to avoid long waiting times for items rendered later down the page
            const delay = Math.min(index * 40, 240);
            delayTimer.current = setTimeout(() => setIsVisible(true), delay);
        }
        return () => { if (delayTimer.current) clearTimeout(delayTimer.current); };
    }, [inView, index]);



    const { Manifest, DownloadCount, StarsCount, CachedIconFile, CachedIconFileMin } = plugin;

    const iconSrc = CachedIconFileMin
        ? `/icons/${CachedIconFileMin}`
        : CachedIconFile
            ? `/icons/${CachedIconFile}`
            : undefined;

    // Detect if this is a "new" or "updated" plugin using a mock heuristic for now
    // (since static index doesn't have exact timestamps, we mark high stars + recent index version as a proxy or just simulate a badge for UX demo)
    const isNewOrUpdated = Manifest.Version.startsWith('1.') && StarsCount > 10;

    const handleInstallClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = `classisland://app/plugin/install?id=${Manifest.Id}`;
    };

    const [isDownloading, setIsDownloading] = useState(false);
    const handleDownloadClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDownloading(true);
        if (plugin.LocalDownloadChunkManifest) {
            downloadCipxByManifest(plugin.LocalDownloadChunkManifest, { fallbackFileName: `${Manifest.Id}.cipx` })
                .then(res => { setChecksumInfo(res); setIsDownloading(false); })
                .catch((err) => {
                    console.error('Failed to download from manifest:', err);
                    if (resolvedDownloadUrl) {
                        downloadFileUrl(resolvedDownloadUrl, { fallbackFileName: `${Manifest.Id}.cipx` })
                            .then(res => { setChecksumInfo(res); setIsDownloading(false); })
                            .catch(() => {
                                window.location.href = resolvedDownloadUrl;
                                setIsDownloading(false);
                            });
                    } else {
                        setIsDownloading(false);
                    }
                });
            return;
        }
        if (resolvedDownloadUrl) {
            downloadFileUrl(resolvedDownloadUrl, { fallbackFileName: `${Manifest.Id}.cipx` })
                .then(res => { setChecksumInfo(res); setIsDownloading(false); })
                .catch(() => {
                    window.location.href = resolvedDownloadUrl;
                    setIsDownloading(false);
                });
        } else {
            setIsDownloading(false);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        cardRef.current.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        cardRef.current.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };

    const handleCopyId = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(Manifest.Id).then(() => {
            setCopied(true);
            dispatchToast(
                <Toast>
                    <ToastTitle>Copied</ToastTitle>
                    <ToastBody>Plugin ID has been copied to clipboard.</ToastBody>
                </Toast>,
                { intent: 'success' }
            );
            window.setTimeout(() => setCopied(false), 1500);
        }).catch(() => { });
    };

    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/plugin/${Manifest.Id}`;
        navigator.clipboard.writeText(url).then(() => {
            dispatchToast(
                <Toast>
                    <ToastTitle>Copied</ToastTitle>
                    <ToastBody>Plugin link has been copied to clipboard.</ToastBody>
                </Toast>,
                { intent: 'success' }
            );
        }).catch(() => { });
    };

    const isHoveringRef = useRef(isHovering);
    useEffect(() => {
        isHoveringRef.current = isHovering;
    }, [isHovering]);

    useEffect(() => {
        const handleBlur = () => {
            setIsHovering(false);
        };
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsHovering(false);
                setIsTouchExpanded(false);
            }
        };
        const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
            if (isTouchExpanded && cardRef.current && !cardRef.current.contains(e.target as Node)) {
                setIsTouchExpanded(false);
                setIsHovering(false);
            }
        };
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('touchstart', handleDocumentClick, { capture: true });
        document.addEventListener('mousedown', handleDocumentClick, { capture: true });
        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('touchstart', handleDocumentClick, { capture: true });
            document.removeEventListener('mousedown', handleDocumentClick, { capture: true });
        };
    }, [isTouchExpanded]);

    useEffect(() => {
        const updateHeight = () => {
            if (cardRef.current && !isHoveringRef.current) {
                setBaseHeight(cardRef.current.offsetHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [Manifest.Description, Manifest.Id, Manifest.Name, Manifest.Version, Manifest.Author]);

    useEffect(() => {
        if (!isHovering) {
            const timer = setTimeout(() => {
                if (cardRef.current && !isHoveringRef.current) {
                    setBaseHeight(cardRef.current.offsetHeight);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isHovering]);

    const transitionId = Manifest.Id.replace(/[^a-zA-Z0-9]/g, '-');

    return (
        <>
            {/* The overlay is rendered outside the wrapper to avoid clipping/z-index issues from siblings */}
            {isTouchExpanded && (
                <div
                    className={mergeClasses(styles.overlay, isTouchExpanded && styles.overlayVisible)}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsTouchExpanded(false);
                        setIsHovering(false);
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsTouchExpanded(false);
                        setIsHovering(false);
                    }}
                />
            )}
            <div
                ref={ref}
                className={mergeClasses(
                    styles.cardWrapper,
                    isVisible && styles.cardWrapperVisible,
                    isHovering && styles.cardWrapperHovering,
                    isTouchExpanded && styles.cardWrapperTouchExpanded
                )}
                style={baseHeight ? { height: `${baseHeight}px` } : undefined}
                onMouseEnter={() => {
                    if (window.matchMedia("(hover: none)").matches) return; // Prevent hover logic breaking touch UX in some browsers
                    router.prefetch(`/plugin/${Manifest.Id}`);
                    if (iconSrc) {
                        const img = new Image();
                        img.src = iconSrc;
                    }
                    if (plugin.LocalReadmeUrl) {
                        fetch(plugin.LocalReadmeUrl)
                            .then(res => res.text())
                            .then(text => {
                                const mdRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
                                const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
                                let match;
                                while ((match = mdRegex.exec(text)) !== null) {
                                    if (match[1]) new Image().src = match[1];
                                }
                                while ((match = htmlRegex.exec(text)) !== null) {
                                    if (match[1]) new Image().src = match[1];
                                }
                            })
                            .catch(() => { });
                    } else if (Manifest.Readme) {
                        fetch(Manifest.Readme, { mode: 'no-cors' }).catch(() => { });
                    }
                    if (!isTouchExpanded) {
                        setIsHovering(true);
                    }
                }}
                onMouseLeave={() => {
                    if (window.matchMedia("(hover: none)").matches) return;
                    if (!isTouchExpanded) setIsHovering(false);
                }}
            >
                <Link
                    href={`/plugin/${Manifest.Id}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                    onClick={(e) => {
                        if (window.matchMedia("(hover: none)").matches && !isTouchExpanded) {
                            e.preventDefault();
                            setIsTouchExpanded(true);
                            setIsHovering(true);
                        } else if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button !== 1) {
                            setIsNavigating(true);
                        }
                    }}
                >
                    <Tilt
                        tiltMaxAngleX={8}
                        tiltMaxAngleY={8}
                        perspective={1000}
                        scale={1.03}
                        transitionSpeed={400}
                        glareEnable={false}
                        tiltReverse={true}
                        style={{ width: '100%', height: '100%', minHeight: baseHeight ? `${baseHeight}px` : 'auto' }}
                    >
                        <Card
                            className={mergeClasses(styles.card, isTouchExpanded && styles.cardTouchExpanded)}
                            ref={cardRef}
                            onMouseMove={(e) => {
                                if (window.matchMedia("(hover: none)").matches) return;
                                handleMouseMove(e);
                            }}
                            onMouseLeave={() => {
                                if (window.matchMedia("(hover: none)").matches) return;
                                if (!isTouchExpanded) setIsHovering(false);
                            }}
                            style={{ viewTransitionName: `card-box-${transitionId}` } as React.CSSProperties}
                        >
                        <CardHeader
                            image={
                                <div style={{ viewTransitionName: `avatar-img-${transitionId}`, position: 'relative' } as React.CSSProperties}>
                                    {/* Inline skeleton/placeholder using pure CSS */}
                                    {!iconSrc && (
                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: tokens.colorNeutralBackground3, borderRadius: tokens.borderRadiusMedium, animation: 'pulse 1.5s infinite ease-in-out' }} />
                                    )}
                                    <Avatar
                                        image={iconSrc ? { src: iconSrc } : undefined}
                                        name={Manifest.Name}
                                        shape="square"
                                        size={48}
                                        style={{ opacity: iconSrc ? 1 : 0.8, transition: 'opacity 0.3s' }}
                                    />
                                    <style jsx>{`
                                        @keyframes pulse {
                                            0% { opacity: 0.6; }
                                            50% { opacity: 1; }
                                            100% { opacity: 0.6; }
                                        }
                                    `}</style>
                                </div>
                            }
                            header={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <Text weight="semibold" size={400} as="h3" className={styles.truncate} style={{ margin: 0, viewTransitionName: `title-text-${transitionId}` } as React.CSSProperties}>
                                        {Manifest.Name}
                                    </Text>
                                    {isNewOrUpdated && (
                                        <div style={{ backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground2, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            NEW
                                        </div>
                                    )}
                                </div>
                            }
                            description={
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                                    <Text size={300} className={styles.truncate} style={{ color: tokens.colorNeutralForeground3 }}>
                                        {Manifest.Author || t('anonymous')}
                                    </Text>
                                    <Text size={200} className={styles.truncate} style={{ color: tokens.colorNeutralForeground4 }}>
                                        {t('version')} {Manifest.Version}{fileSizeStr ? ` • ${fileSizeStr}` : ''}
                                    </Text>
                                </div>
                            }
                        />
                        <div className={mergeClasses(styles.hoverInfo, isHovering ? styles.hoverInfoVisible : styles.hoverInfoHidden)}>
                            <p className={styles.hoverDescription}>
                                {Manifest.Description || "No description provided."}
                            </p>
                            <div className={styles.hoverIdRow}>
                                <span className={styles.hoverId} title={Manifest.Id}>{Manifest.Id}</span>
                                <Button
                                    aria-label={copied ? t('copied') : t('copyId')}
                                    appearance="subtle"
                                    icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
                                    className={styles.copyButton}
                                    onClick={handleCopyId}
                                    title={copied ? t('copied') : t('copyId')}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isNavigating ? (
                                <div className={styles.hoverOpenIcon} style={{ opacity: 1, transform: 'scale(1)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Spinner size="extra-tiny" appearance="primary" />
                                </div>
                            ) : (
                                <OpenRegular className={mergeClasses(styles.hoverOpenIcon, isHovering ? styles.hoverOpenIconVisible : styles.hoverOpenIconHidden)} />
                            )}
                        </div>
                        <CardFooter style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                            <div className={styles.statsRow} style={{ marginTop: 0 }}>
                                <div className={styles.stat} title={t('downloads')}>
                                    <ArrowDownloadRegular fontSize={16} />
                                    <Text size={200}>{DownloadCount}</Text>
                                </div>
                                <div className={styles.stat} title={t('stars')}>
                                    <StarRegular fontSize={16} />
                                    <Text size={200}>{StarsCount}</Text>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {isWin ? (
                                    <>
                                        <Button
                                            appearance="primary"
                                            size="small"
                                            className={mergeClasses(styles.actionButton, styles.installButton)}
                                            style={{ flex: 1 }}
                                            icon={<OpenRegular />}
                                            onClick={handleInstallClick}
                                        >
                                            {t('install')}
                                        </Button>
                                        <Button
                                            appearance="outline"
                                            size="small"
                                            className={mergeClasses(styles.actionButton, styles.downloadButton)}
                                            icon={isDownloading ? <CheckmarkRegular className="animate-pulse" /> : <ArrowDownloadRegular />}
                                            onClick={handleDownloadClick}
                                            disabled={isDownloading}
                                        >
                                            {isDownloading ? 'Downloading...' : t('download')}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        appearance="outline"
                                        size="small"
                                        className={mergeClasses(styles.actionButton, styles.downloadButton)}
                                        style={{ flex: 1 }}
                                        icon={isDownloading ? <CheckmarkRegular className="animate-pulse" /> : <ArrowDownloadRegular />}
                                        onClick={handleDownloadClick}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? 'Downloading...' : fileSizeStr || t('download')}
                                    </Button>
                                )}
                                <Button
                                    aria-label="Copy plugin link"
                                    appearance="outline"
                                    icon={<ShareRegular />}
                                    onClick={handleCopyLink}
                                    title="Copy plugin link"
                                    size="small"
                                    className={styles.actionButton}
                                    style={{ minWidth: 'auto', width: '32px', padding: 0 }}
                                />
                            </div>
                        </CardFooter>
                        </Card>
                    </Tilt>
                </Link>
                <ChecksumDialog info={checksumInfo} onClose={() => setChecksumInfo(null)} />
            </div>
        </>
    );
}
