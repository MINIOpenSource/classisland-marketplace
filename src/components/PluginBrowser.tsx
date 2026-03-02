'use client';

import { PluginCard, PluginData } from '@/components/PluginCard';
import { PluginGrid } from '@/components/PluginGrid';
import { useState, useMemo } from 'react';
import { Select, makeStyles, tokens, Text, Input } from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';
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
    select: {
        minWidth: '140px',
        borderRadius: tokens.borderRadiusLarge,
        transition: 'border-color 160ms ease, box-shadow 160ms ease',
        ':hover': {
            border: `1px solid ${tokens.colorBrandStroke1}`,
            boxShadow: tokens.shadow4,
        }
    },
});

export function PluginBrowser({ plugins }: { plugins: PluginData[] }) {
    const styles = useStyles();
    const t = useTranslations('Index');
    const [sortMethod, setSortMethod] = useState<'name' | 'downloads' | 'stars'>('downloads');
    const [search, setSearch] = useState('');
    const animationVersion = `${sortMethod}::${search.trim().toLowerCase() || 'all'}`;

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
            if (sortMethod === 'downloads') {
                return b.DownloadCount - a.DownloadCount;
            } else if (sortMethod === 'stars') {
                return b.StarsCount - a.StarsCount;
            } else {
                return a.Manifest.Name.localeCompare(b.Manifest.Name);
            }
        });
        return copy;
    }, [filteredPlugins, sortMethod]);

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
                        <Select
                            id="sort-select"
                            value={sortMethod}
                            onChange={(_, data) => {
                                const value = data.value;
                                if (value === 'name' || value === 'downloads' || value === 'stars') {
                                    setSortMethod(value);
                                }
                            }}
                            className={styles.select}
                        >
                            <option value="downloads">{t('sortDownloads')}</option>
                            <option value="stars">{t('sortStars')}</option>
                            <option value="name">{t('sortName')}</option>
                        </Select>
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
