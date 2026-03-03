'use client';

import {
    Card,
    CardHeader,
    CardFooter,
    Text,
    Avatar,
    Button,
    makeStyles,
    mergeClasses,
    tokens
} from '@fluentui/react-components';
import { ArrowDownloadRegular, StarRegular, OpenRegular, CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

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
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
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
            transform: 'translateY(-4px) scale(1.1)',
            boxShadow: tokens.shadow16,
            border: `1px solid ${tokens.colorBrandStroke1}`,
            '&::before': {
                opacity: 1,
            },
            '&::after': {
                opacity: 1,
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
});

export interface PluginData {
    DownloadUrl: string;
    LocalDownloadUrl?: string;
    LocalReadmeUrl?: string;
    DownloadCount: number;
    StarsCount: number;
    FileSize?: number;
    CachedIconFile?: string;
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
    const [fileSizeStr, setFileSizeStr] = useState<string | null>(plugin.FileSize ? formatBytes(plugin.FileSize) : null);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [copied, setCopied] = useState(false);
    const [baseHeight, setBaseHeight] = useState<number | null>(null);
    const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const resolvedDownloadUrl = plugin.LocalDownloadUrl || plugin.DownloadUrl;

    useEffect(() => {
        if (inView) {
            // Cap the staggered delay to avoid long waiting times for items rendered later down the page
            const delay = Math.min(index * 40, 240);
            delayTimer.current = setTimeout(() => setIsVisible(true), delay);
        }
        return () => { if (delayTimer.current) clearTimeout(delayTimer.current); };
    }, [inView, index]);

    useEffect(() => {
        if (inView && resolvedDownloadUrl && !fileSizeStr) {
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
    }, [inView, resolvedDownloadUrl, fileSizeStr]);

    const { Manifest, DownloadCount, StarsCount, RealIconPath, CachedIconFile } = plugin;

    const iconSrc = CachedIconFile
        ? `/icons/${CachedIconFile}`
        : RealIconPath
            ? RealIconPath
            : undefined;

    const handleInstallClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = `classisland://app/plugin/install?id=${Manifest.Id}`;
    };

    const handleDownloadClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (resolvedDownloadUrl) {
            window.location.href = resolvedDownloadUrl;
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
            window.setTimeout(() => setCopied(false), 1500);
        }).catch(() => { });
    };

    const isHoveringRef = useRef(isHovering);
    useEffect(() => {
        isHoveringRef.current = isHovering;
    }, [isHovering]);

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

    const transitionId = Manifest.Id.replace(/[^a-zA-Z0-9]/g, '-');

    return (
        <div
            ref={ref}
            className={mergeClasses(styles.cardWrapper, isVisible && styles.cardWrapperVisible, isHovering && styles.cardWrapperHovering)}
            style={baseHeight ? { height: `${baseHeight}px` } : undefined}
            onMouseEnter={() => {
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
                setIsHovering(true);
            }}
            onMouseLeave={() => setIsHovering(false)}
        >
            <Link href={`/plugin/${Manifest.Id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <Card className={styles.card} ref={cardRef} onMouseMove={handleMouseMove} style={{ viewTransitionName: `card-box-${transitionId}` } as React.CSSProperties}>
                    <CardHeader
                        image={
                            <div style={{ viewTransitionName: `avatar-img-${transitionId}` } as React.CSSProperties}>
                                <Avatar
                                    image={iconSrc ? { src: iconSrc } : undefined}
                                    name={Manifest.Name}
                                    shape="square"
                                    size={48}
                                />
                            </div>
                        }
                        header={
                            <Text weight="semibold" size={400} as="h3" style={{ margin: 0, display: 'inline-block', viewTransitionName: `title-text-${transitionId}` } as React.CSSProperties}>
                                {Manifest.Name}
                            </Text>
                        }
                        description={
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                                appearance="subtle"
                                icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
                                className={styles.copyButton}
                                onClick={handleCopyId}
                                title={copied ? t('copied') : t('copyId')}
                            />
                        </div>
                    </div>
                    <OpenRegular className={mergeClasses(styles.hoverOpenIcon, isHovering ? styles.hoverOpenIconVisible : styles.hoverOpenIconHidden)} />
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
                                        icon={<ArrowDownloadRegular />}
                                        onClick={handleDownloadClick}
                                    >
                                        {t('download')}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    appearance="outline"
                                    size="small"
                                    className={mergeClasses(styles.actionButton, styles.downloadButton)}
                                    style={{ flex: 1 }}
                                    icon={<ArrowDownloadRegular />}
                                    onClick={handleDownloadClick}
                                >
                                    {fileSizeStr || t('download')}
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </Link>
        </div>
    );
}
