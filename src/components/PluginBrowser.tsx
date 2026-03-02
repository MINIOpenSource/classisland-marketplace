'use client';

import { PluginCard, PluginData } from '@/components/PluginCard';
import { PluginGrid } from '@/components/PluginGrid';
import { useState, useMemo } from 'react';
import { Button, makeStyles, tokens, Text, Input } from '@fluentui/react-components';
import { SearchRegular, ArrowUpRegular, ArrowDownRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';

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
        backgroundColor: tokens.colorNeutralBackground1,
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
    }
});

export function PluginBrowser({ plugins }: { plugins: PluginData[] }) {
    const styles = useStyles();
    const t = useTranslations('Index');
    const [sortMethod, setSortMethod] = useState<'name' | 'downloads' | 'stars'>('downloads');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState('');
    const animationVersion = `${sortMethod}::${sortOrder}::${search.trim().toLowerCase() || 'all'}`;

    const handleSortChange = (method: 'name' | 'downloads' | 'stars') => {
        if (sortMethod === method) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortMethod(method);
            setSortOrder(method === 'name' ? 'asc' : 'desc');
        }
    };

    const filteredPlugins = useMemo(() => {
        const keyword = search.trim().toLowerCase();
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
    }, [plugins, search]);

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

    return (
        <div>
            <div className={styles.toolbarShell}>
                <div className={styles.toolbar}>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        contentBefore={<SearchRegular />}
                        className={styles.searchInput}
                    />
                    <div className={styles.toolbarRight}>
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

            <PluginGrid>
                {sortedPlugins.map((plugin, index) => (
                    <PluginCard key={`${plugin.Manifest.Id}-${animationVersion}`} plugin={plugin} index={index} />
                ))}
            </PluginGrid>

            {sortedPlugins.length > 0 && (
                <div style={{ textAlign: 'center', margin: '48px 0 24px 0', color: tokens.colorNeutralForeground3 }}>
                    <Text size={300}>{t('allLoaded', { count: sortedPlugins.length })}</Text>
                </div>
            )}
        </div>
    );
}
