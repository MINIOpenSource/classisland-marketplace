'use client';

import { PluginCard, PluginData } from '@/components/PluginCard';
import { PluginGrid } from '@/components/PluginGrid';
import { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { Button, makeStyles, tokens, Text, Input } from '@fluentui/react-components';
import { SearchRegular, ArrowUpRegular, ArrowDownRegular, DismissRegular, DocumentSearchRegular, WandRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const useStyles = makeStyles({
    toolbarShell: {
        position: 'sticky',
        top: '72px',
        zIndex: 900,
        paddingTop: '18px',
        paddingBottom: '12px',
        backgroundColor: 'transparent',
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusXLarge,
        backgroundColor: 'color-mix(in srgb, var(--colorNeutralBackground1) 75%, transparent)',
        backdropFilter: 'blur(10px)',
        boxShadow: tokens.shadow4,
        flexWrap: 'wrap',
    },
    toolbarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    searchInput: {
        minWidth: '260px',
        maxWidth: '560px',
        flexGrow: 1,
        borderRadius: tokens.borderRadiusLarge,
        ':focus-within': {
            boxShadow: tokens.shadow8,
        },
        '@media (max-width: 720px)': {
            minWidth: '100%',
        }
    },
    sortGroup: {
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        padding: '3px',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusLarge,
    },
    sortButton: {
        borderRadius: tokens.borderRadiusMedium,
        transition: 'all 0.15s ease-in-out',
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        color: tokens.colorNeutralForeground3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        animation: 'route-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
    },
    emptyStateIcon: {
        fontSize: '48px',
        color: tokens.colorNeutralForeground4,
    }
});

export function PluginBrowser({ plugins }: { plugins: PluginData[] }) {
    const styles = useStyles();
    const router = useRouter();
    const t = useTranslations('Index');
    const [sortMethod, setSortMethod] = useState<'name' | 'downloads' | 'stars'>('downloads');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const animationVersion = `${sortMethod}::${sortOrder}::${deferredSearch.trim().toLowerCase() || 'all'}`;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSortChange = (method: 'name' | 'downloads' | 'stars') => {
        if (sortMethod === method) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortMethod(method);
            setSortOrder(method === 'name' ? 'asc' : 'desc');
        }
    };

    const filteredPlugins = useMemo(() => {
        const keyword = deferredSearch.trim().toLowerCase();
        if (!keyword) {
            return plugins;
        }

        return plugins.filter((plugin) => {
            const name = plugin.Manifest.Name?.toLowerCase() || '';
            const author = plugin.Manifest.Author?.toLowerCase() || '';
            const id = plugin.Manifest.Id?.toLowerCase() || '';
            const description = plugin.Manifest.Description?.toLowerCase() || '';
            return name.includes(keyword) || author.includes(keyword) || id.includes(keyword) || description.includes(keyword);
        });
    }, [plugins, deferredSearch]);

    const sortedPlugins = useMemo(() => {
        const copy = [...filteredPlugins];
        copy.sort((a, b) => {
            let result = 0;
            if (sortMethod === 'downloads') {
                result = a.DownloadCount - b.DownloadCount;
            } else if (sortMethod === 'stars') {
                result = a.StarsCount - b.StarsCount;
            } else {
                result = a.Manifest.Name.localeCompare(b.Manifest.Name);
            }
            return sortOrder === 'asc' ? result : -result;
        });
        return copy;
    }, [filteredPlugins, sortMethod, sortOrder]);

    const handleFeelingLucky = () => {
        if (sortedPlugins.length > 0) {
            const randomIndex = Math.floor(Math.random() * sortedPlugins.length);
            const randomPlugin = sortedPlugins[randomIndex];
            router.push(`/plugin/${randomPlugin.Manifest.Id}`);
        }
    };

    return (
        <div>
            <div className={styles.toolbarShell}>
                <div className={styles.toolbar}>
                    <Input
                        ref={searchInputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        contentBefore={<SearchRegular />}
                        contentAfter={
                            search ? (
                                <DismissRegular
                                    style={{ cursor: 'pointer', color: tokens.colorNeutralForeground3 }}
                                    onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                                />
                            ) : null
                        }
                        className={styles.searchInput}
                    />
                    <div className={styles.toolbarRight}>
                        <Button
                            appearance="subtle"
                            icon={<WandRegular />}
                            onClick={handleFeelingLucky}
                            disabled={sortedPlugins.length === 0}
                        >
                            手气不错
                        </Button>
                        <Text weight="semibold" size={300}>{t('sortBy')}</Text>
                        <div className={styles.sortGroup}>
                            <Button
                                appearance={sortMethod === 'downloads' ? 'secondary' : 'subtle'}
                                iconPosition="after"
                                icon={sortMethod === 'downloads' ? (sortOrder === 'asc' ? <ArrowUpRegular fontSize={16} /> : <ArrowDownRegular fontSize={16} />) : undefined}
                                onClick={() => handleSortChange('downloads')}
                                className={styles.sortButton}
                                size="small"
                            >
                                {t('sortDownloads')}
                            </Button>
                            <Button
                                appearance={sortMethod === 'stars' ? 'secondary' : 'subtle'}
                                iconPosition="after"
                                icon={sortMethod === 'stars' ? (sortOrder === 'asc' ? <ArrowUpRegular fontSize={16} /> : <ArrowDownRegular fontSize={16} />) : undefined}
                                onClick={() => handleSortChange('stars')}
                                className={styles.sortButton}
                                size="small"
                            >
                                {t('sortStars')}
                            </Button>
                            <Button
                                appearance={sortMethod === 'name' ? 'secondary' : 'subtle'}
                                iconPosition="after"
                                icon={sortMethod === 'name' ? (sortOrder === 'asc' ? <ArrowUpRegular fontSize={16} /> : <ArrowDownRegular fontSize={16} />) : undefined}
                                onClick={() => handleSortChange('name')}
                                className={styles.sortButton}
                                size="small"
                            >
                                {t('sortName')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {sortedPlugins.length > 0 ? (
                <PluginGrid>
                    {sortedPlugins.map((plugin, index) => (
                        <PluginCard key={`${plugin.Manifest.Id}-${animationVersion}`} plugin={plugin} index={index} />
                    ))}
                </PluginGrid>
            ) : (
                <div className={styles.emptyState}>
                    <DocumentSearchRegular className={styles.emptyStateIcon} />
                    <Text size={500} weight="semibold">No plugins found</Text>
                    <Text size={300}>We couldn&apos;t find anything matching &quot;{search}&quot;. Try another search term.</Text>
                    <Button onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}>Clear search</Button>
                </div>
            )}

            {sortedPlugins.length > 0 && (
                <div style={{ textAlign: 'center', margin: '48px 0 24px 0', color: tokens.colorNeutralForeground3 }}>
                    <Text size={300}>{t('allLoaded', { count: sortedPlugins.length })}</Text>
                </div>
            )}
        </div>
    );
}
