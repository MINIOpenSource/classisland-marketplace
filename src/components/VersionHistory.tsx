'use client';

import {
    makeStyles,
    tokens,
    Text,
    Button,
    Badge,
    Tooltip,
} from '@fluentui/react-components';
import {
    ChevronDownRegular,
    ChevronUpRegular,
    ArrowDownloadRegular,
    TagRegular,
    CalendarRegular,
    HistoryRegular,
    CheckmarkCircleRegular,
    ArrowCircleDownRegular,
    DocumentFooterRegular,
} from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import { useState, useRef } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { downloadCipxByManifest, downloadFileUrl } from '@/utils/cipxDownloader';
import { ChecksumDialog, ChecksumInfo } from './ChecksumDialog';

export interface VersionEntry {
    version: string;
    tagName: string;
    publishedAt: string;
    body: string;
    downloadUrl?: string;
    cipxDownloadUrl?: string;
    cipxChunkManifestUrl?: string;
    cipxSize?: number;
    localDescriptionUrl?: string;
    prerelease: boolean;
    md5Checksum?: string;
}

function formatBytes(bytes?: number, decimals = 2) {
    if (bytes === undefined || bytes === null || !+bytes) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function relativeTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 30) return `${diffDays} days ago`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths === 1) return '1 month ago';
        if (diffMonths < 12) return `${diffMonths} months ago`;
        const diffYears = Math.floor(diffMonths / 12);
        if (diffYears === 1) return '1 year ago';
        return `${diffYears} years ago`;
    } catch {
        return '';
    }
}

const useStyles = makeStyles({
    container: {
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusXLarge,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        boxShadow: tokens.shadow4,
        overflow: 'clip',
        animationName: {
            from: { opacity: 0, transform: 'translateY(16px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
        },
        animationDuration: '0.6s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
        animationDelay: '0.15s',
        transition: 'box-shadow 220ms ease, border-color 220ms ease',
        '&:hover': {
            boxShadow: tokens.shadow8,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
        },
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'sticky',
        top: '72px',
        zIndex: 10,
        backgroundColor: tokens.colorNeutralBackground1,
        borderTopLeftRadius: tokens.borderRadiusXLarge,
        borderTopRightRadius: tokens.borderRadiusXLarge,
        transition: 'background-color 150ms ease',
        '&:hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    headerIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: tokens.borderRadiusLarge,
        backgroundColor: tokens.colorBrandBackground2,
        color: tokens.colorBrandForeground1,
    },
    versionCount: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    timeline: {
        padding: '16px 28px 24px 28px',
        position: 'relative',
        animationName: {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
        },
        animationDuration: '0.2s',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'both',
    },
    timelineItem: {
        display: 'flex',
        gap: '16px',
        position: 'relative',
        paddingBottom: '24px',
        transition: 'opacity 200ms ease, transform 200ms ease',
        '&:last-child': {
            paddingBottom: '0',
        },
    },
    timelineLine: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '24px',
        flexShrink: 0,
    },
    timelineDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: tokens.colorNeutralStroke1,
        border: `2px solid ${tokens.colorNeutralBackground1}`,
        boxShadow: `0 0 0 2px ${tokens.colorNeutralStroke2}`,
        zIndex: 1,
        flexShrink: 0,
        marginTop: '6px',
    },
    timelineDotActive: {
        backgroundColor: tokens.colorBrandBackground,
        boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}, 0 0 8px ${tokens.colorBrandBackground2}`,
    },
    timelineDotPre: {
        backgroundColor: tokens.colorPaletteYellowBackground3,
        boxShadow: `0 0 0 2px ${tokens.colorPaletteYellowBorder2}`,
    },
    timelineConnector: {
        width: '2px',
        flexGrow: 1,
        backgroundColor: tokens.colorNeutralStroke2,
        marginTop: '4px',
    },
    versionContent: {
        flex: 1,
        minWidth: 0,
    },
    versionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    versionTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontWeight: tokens.fontWeightSemibold,
        fontSize: '14px',
        color: tokens.colorNeutralForeground1,
    },
    versionMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '6px',
        flexWrap: 'wrap',
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: tokens.colorNeutralForeground3,
        fontSize: '12px',
    },
    versionBody: {
        marginTop: '8px',
        padding: '12px 14px',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke3}`,
        maxHeight: '250px',
        overflowY: 'auto',
        '& [data-color-mode*="light"], & [data-color-mode*="dark"]': {
            backgroundColor: 'transparent !important',
        },
    },
    downloadBtn: {
        marginTop: '8px',
    },
    showMoreBtn: {
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '8px',
        paddingBottom: '4px',
    },
    emptyState: {
        padding: '32px 28px',
        textAlign: 'center',
        color: tokens.colorNeutralForeground3,
    },
});

export function VersionHistory({
    versions,
    currentVersion,
}: {
    versions: VersionEntry[];
    currentVersion: string;
}) {
    const styles = useStyles();
    const t = useTranslations('Index');
    const [expanded, setExpanded] = useState(false);
    const [downloadingTag, setDownloadingTag] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [checksumInfo, setChecksumInfo] = useState<ChecksumInfo | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleExpanded = () => {
        if (expanded && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.top < 72) {
                window.scrollTo({
                    top: window.scrollY + rect.top - 72,
                });
            }
        }
        setExpanded(!expanded);
    };

    if (!versions || versions.length === 0) {
        return null;
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <div
                className={styles.header}
                style={{
                    borderBottomLeftRadius: expanded ? 0 : tokens.borderRadiusXLarge,
                    borderBottomRightRadius: expanded ? 0 : tokens.borderRadiusXLarge,
                    borderBottom: expanded ? `1px solid ${tokens.colorNeutralStroke2}` : '1px solid transparent'
                }}
                onClick={toggleExpanded}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpanded();
                    }
                }}
                aria-expanded={expanded}
                id="version-history-header"
            >
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <HistoryRegular fontSize={20} />
                    </div>
                    <div>
                        <Text weight="semibold" size={400}>
                            {t('versionHistory')}
                        </Text>
                    </div>
                </div>
                <div className={styles.versionCount}>
                    <Badge
                        appearance="tint"
                        color="informative"
                        size="medium"
                    >
                        {versions.length} {versions.length > 1 ? t('versionPlural') : t('versionSingular')}
                    </Badge>
                    {expanded ? (
                        <ChevronUpRegular fontSize={20} />
                    ) : (
                        <ChevronDownRegular fontSize={20} />
                    )}
                </div>
            </div>

            {expanded && (
                <div className={styles.timeline}>
                    {versions.map((entry, idx) => {
                        const isCurrent = entry.version === currentVersion;
                        return (
                            <div key={entry.tagName || idx} className={styles.timelineItem}>
                                <div className={styles.timelineLine}>
                                    <div
                                        className={`${styles.timelineDot} ${isCurrent
                                            ? styles.timelineDotActive
                                            : entry.prerelease
                                                ? styles.timelineDotPre
                                                : ''
                                            }`}
                                    />
                                    {idx < versions.length - 1 && (
                                        <div className={styles.timelineConnector} />
                                    )}
                                </div>
                                <div className={styles.versionContent}>
                                    <div className={styles.versionHeader}>
                                        <span className={styles.versionTag}>
                                            <TagRegular fontSize={16} />
                                            {entry.version || entry.tagName}
                                        </span>
                                        {isCurrent && (
                                            <Tooltip content={t('currentVersion')} relationship="label">
                                                <Badge
                                                    appearance="filled"
                                                    color="brand"
                                                    size="small"
                                                    icon={<CheckmarkCircleRegular />}
                                                >
                                                    {t('current')}
                                                </Badge>
                                            </Tooltip>
                                        )}
                                        {entry.prerelease && (
                                            <Badge
                                                appearance="tint"
                                                color="warning"
                                                size="small"
                                            >
                                                {t('prerelease')}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className={styles.versionMeta}>
                                        {entry.publishedAt && (
                                            <Tooltip content={formatDate(entry.publishedAt)} relationship="label">
                                                <span className={styles.metaItem}>
                                                    <CalendarRegular fontSize={14} />
                                                    {relativeTime(entry.publishedAt)}
                                                </span>
                                            </Tooltip>
                                        )}
                                        {entry.cipxSize !== undefined && entry.cipxSize > 0 && (
                                            <span className={styles.metaItem}>
                                                <ArrowCircleDownRegular fontSize={14} />
                                                {formatBytes(entry.cipxSize)}
                                            </span>
                                        )}
                                        {entry.md5Checksum && (
                                            <Tooltip content={entry.md5Checksum} relationship="label">
                                                <span className={styles.metaItem}>
                                                    <DocumentFooterRegular fontSize={14} />
                                                    MD5: {entry.md5Checksum.substring(0, 8)}...
                                                </span>
                                            </Tooltip>
                                        )}
                                    </div>
                                    {entry.body && entry.body.trim() && (
                                        <div className={styles.versionBody}>
                                            <MarkdownPreview
                                                source={entry.body.trim()}
                                                style={{ backgroundColor: 'transparent', fontSize: '13px', color: 'inherit' }}
                                            />
                                        </div>
                                    )}
                                    {(entry.cipxDownloadUrl || entry.cipxChunkManifestUrl) && (
                                        <Button
                                            className={styles.downloadBtn}
                                            appearance="subtle"
                                            size="small"
                                            icon={<ArrowDownloadRegular />}
                                            disabled={downloadingTag === (entry.tagName || entry.version)}
                                            onClick={() => {
                                                const key = entry.tagName || entry.version;
                                                if (entry.cipxChunkManifestUrl) {
                                                    setDownloadingTag(key);
                                                    setDownloadProgress(0);
                                                    downloadCipxByManifest(entry.cipxChunkManifestUrl, {
                                                        fallbackFileName: `${key || 'plugin'}.cipx`,
                                                        onProgress: ({ completedChunks, totalChunks }) => {
                                                            setDownloadProgress(totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0);
                                                        },
                                                    }).then(res => setChecksumInfo(entry.md5Checksum ? { ...res, checksum: entry.md5Checksum } : res)).catch(() => {
                                                        if (entry.cipxDownloadUrl) {
                                                            downloadFileUrl(entry.cipxDownloadUrl, {
                                                                fallbackFileName: `${key || 'plugin'}.cipx`,
                                                                onProgress: ({ loadedBytes, totalBytes }) => {
                                                                    setDownloadProgress(totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0);
                                                                }
                                                            }).then(res => setChecksumInfo(entry.md5Checksum ? { ...res, checksum: entry.md5Checksum } : res)).catch(() => {
                                                                window.location.href = entry.cipxDownloadUrl!;
                                                            });
                                                        }
                                                    }).finally(() => {
                                                        setDownloadingTag(null);
                                                    });
                                                    return;
                                                }
                                                if (entry.cipxDownloadUrl) {
                                                    setDownloadingTag(key);
                                                    setDownloadProgress(0);
                                                    downloadFileUrl(entry.cipxDownloadUrl, {
                                                        fallbackFileName: `${key || 'plugin'}.cipx`,
                                                        onProgress: ({ loadedBytes, totalBytes }) => {
                                                            setDownloadProgress(totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0);
                                                        }
                                                    }).then(res => setChecksumInfo(entry.md5Checksum ? { ...res, checksum: entry.md5Checksum } : res)).catch(() => {
                                                        window.location.href = entry.cipxDownloadUrl!;
                                                    }).finally(() => {
                                                        setDownloadingTag(null);
                                                    });
                                                }
                                            }}
                                        >
                                            {downloadingTag === (entry.tagName || entry.version)
                                                ? `${t('downloadVersion')} ${downloadProgress}%`
                                                : t('downloadVersion')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <ChecksumDialog info={checksumInfo} onClose={() => setChecksumInfo(null)} />
        </div>
    );
}
