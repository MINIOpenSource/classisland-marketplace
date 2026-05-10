'use client';

import { useState, useEffect } from 'react';

import {
    makeStyles,
    tokens,
    Title1,
    Button,
    Menu,
    MenuTrigger,
    MenuList,
    MenuItem,
    MenuPopover,
    Avatar,
    Badge,
    Popover,
    PopoverTrigger,
    PopoverSurface,
    Text,
    ProgressBar,
    Subtitle2
} from '@fluentui/react-components';
import { TranslateRegular, WeatherSunnyRegular, WeatherMoonRegular, ArrowLeftRegular, ChevronRightRegular, ArrowDownloadRegular, PlayRegular, PauseRegular, DismissRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { useTopBar } from '@/components/TopBarProvider';
import { useDownload } from '@/components/DownloadProvider';
import { useRouter } from 'next/navigation';

const useStyles = makeStyles({
    header: {
        height: '80px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: tokens.colorNeutralBackground1,
        boxShadow: tokens.shadow8,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backdropFilter: 'blur(10px)',
        '@media (max-width: 600px)': {
            padding: '0 16px',
        }
    },
    actions: {
        display: 'flex',
        gap: '10px'
    },
    titleWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    titleText: {
        fontSize: '24px',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media (max-width: 600px)': {
            fontSize: '18px',
            gap: '6px',
        },
        '@media (max-width: 400px)': {
            fontSize: '16px',
            gap: '4px',
        }
    },
    logoAvatar: {
        boxShadow: tokens.shadow8,
        flexShrink: 0
    },
    actionButton: {
        borderRadius: tokens.borderRadiusLarge,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: tokens.shadow8,
        },
        ':active': {
            transform: 'translateY(0)',
        },
    },
    actionButtonPrimary: {
        borderRadius: tokens.borderRadiusLarge,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: tokens.shadow8,
        },
        ':active': {
            transform: 'translateY(0)',
        },
    },
    desktopText: {
        '@media (max-width: 600px)': {
            display: 'none',
        }
    }
});

export function Header() {
    const styles = useStyles();
    const t = useTranslations('Index');
    const { setLocale } = useLocale();
    const { isDark, toggleTheme } = useTheme();
    const { showBack, pluginInfo } = useTopBar();
    const { tasks, pauseTask, resumeTask, cancelTask, removeTask, addTask: providerAddTask } = useDownload();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        const handleResize = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDoubleClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <header
            onDoubleClick={handleDoubleClick}
            className={styles.header}
            style={{
                backgroundColor: 'color-mix(in srgb, var(--colorNeutralBackground1) 75%, transparent)',
                top: isScrolled ? '12px' : '0',
                borderRadius: isScrolled ? '16px' : '0',
                margin: isScrolled ? '0 24px' : '0',
                width: isScrolled ? 'calc(100% - 48px)' : '100%',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: isScrolled ? '1px solid var(--colorNeutralStroke1)' : '1px solid transparent',
                borderBottom: isScrolled ? '1px solid var(--colorNeutralStroke1)' : '1px solid var(--colorNeutralStroke2)'
            }}
        >
            <div className={styles.titleWrap}>
                <div style={{
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: showBack ? '38px' : '0',
                    opacity: showBack ? 1 : 0,
                    marginRight: showBack ? '8px' : '0',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <Button
                        aria-label={t('back') || 'Back'}
                        appearance="transparent"
                        icon={<ArrowLeftRegular />}
                        onClick={() => router.back()}
                        style={{ minWidth: '32px', padding: 0 }}
                        title={t('back') || 'Back'}
                    />
                </div>

                <Avatar className={styles.logoAvatar} image={{ src: '/favicon.ico' }} name="ClassIsland" shape="square" size={32} />
                <Title1 as="h1" className={styles.titleText}>
                    <span style={{
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: pluginInfo ? "0px" : "150px",
                        opacity: pluginInfo ? 0 : 1,
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        marginRight: pluginInfo ? "0" : "4px"
                    }}>
                        <span className={styles.desktopText}>ClassIsland</span>
                    </span>
                    <span style={{ marginRight: '8px' }}>Marketplace</span>

                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: pluginInfo ? "300px" : "0px",
                        opacity: pluginInfo ? 1 : 0,
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}>
                        <ChevronRightRegular fontSize={20} style={{ color: tokens.colorNeutralForeground3, marginRight: '8px', flexShrink: 0 }} />
                        {pluginInfo && (
                            <>
                                <Avatar className={styles.logoAvatar} image={pluginInfo.iconSrc ? { src: pluginInfo.iconSrc } : undefined} name={pluginInfo.name} shape="square" size={24} style={{ marginRight: '8px', flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {pluginInfo.name}
                                </span>
                            </>
                        )}
                    </span>

                    <Badge appearance="tint" shape="rounded" color="brand" style={{ fontSize: '12px', paddingTop: '2px', flexShrink: 0 }}>{t('preview')}</Badge>
                </Title1>
            </div>
            <div className={styles.actions}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    maxWidth: pluginInfo ? '300px' : '0px',
                    opacity: pluginInfo ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    {pluginInfo && pluginInfo.actions}
                </div>

                {isMobile ? (
                    <Button
                        aria-label={t('downloads') || 'Downloads'}
                        icon={
                            <div style={{ position: 'relative', display: 'flex' }}>
                                <ArrowDownloadRegular />
                                {tasks.filter(t => t.status === 'downloading').length > 0 && (
                                    <Badge color="danger" size="small" shape="circular" style={{ position: 'absolute', top: -6, right: -6, minWidth: '8px', padding: 0 }} />
                                )}
                            </div>
                        }
                        appearance="subtle"
                        title={t('downloads') || 'Downloads'}
                        className={styles.actionButton}
                        onClick={() => router.push('/downloads')}
                    />
                ) : (
                    <Popover withArrow positioning="below-end">
                        <PopoverTrigger disableButtonEnhancement>
                            <Button
                                aria-label={t('downloads') || 'Downloads'}
                                icon={
                                    <div style={{ position: 'relative', display: 'flex' }}>
                                        <ArrowDownloadRegular />
                                        {tasks.filter(t => t.status === 'downloading').length > 0 && (
                                            <Badge color="danger" size="small" shape="circular" style={{ position: 'absolute', top: -6, right: -6, minWidth: '8px', padding: 0 }} />
                                        )}
                                    </div>
                                }
                                appearance="subtle"
                                title={t('downloads') || 'Downloads'}
                                className={styles.actionButton}
                            />
                        </PopoverTrigger>
                        <PopoverSurface style={{ width: '300px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Subtitle2>{t('downloads') || 'Downloads'}</Subtitle2>
                                <Button appearance="transparent" size="small" onClick={() => router.push('/downloads')}>
                                    {t('viewAll') || 'View All'}
                                </Button>
                            </div>
                            {tasks.length === 0 ? (
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{t('noDownloads') || 'No downloads yet'}</Text>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                    {tasks.map(task => (
                                        <div key={task.id} style={{ padding: '12px', borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginRight: '8px' }}>
                                                    <Text weight="semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.pluginName}</Text>
                                                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{task.version}</Text>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                    {task.status === 'downloading' ? (
                                                        <Button aria-label={t('pause') || 'Pause'} icon={<PauseRegular fontSize={16} />} appearance="subtle" size="small" onClick={() => pauseTask(task.id)} style={{ minWidth: '24px', padding: '0 4px' }} title={t('pause') || 'Pause'} />
                                                    ) : task.status === 'paused' ? (
                                                        <Button aria-label={t('resume') || 'Resume'} icon={<PlayRegular fontSize={16} />} appearance="subtle" size="small" onClick={() => resumeTask(task.id)} style={{ minWidth: '24px', padding: '0 4px' }} title={t('resume') || 'Resume'} />
                                                    ) : null}
                                                    <Button aria-label={(task.status === 'downloading' || task.status === 'paused') ? (t('cancel') || 'Cancel') : (t('delete') || 'Delete')} icon={<DismissRegular fontSize={16} />} appearance="subtle" size="small" onClick={() => {
                                                        if (task.status === 'downloading' || task.status === 'paused') cancelTask(task.id);
                                                        else removeTask(task.id);
                                                    }} style={{ minWidth: '24px', padding: '0 4px' }} title={(task.status === 'downloading' || task.status === 'paused') ? (t('cancel') || 'Cancel') : (t('delete') || 'Delete')} />
                                                </div>
                                            </div>
                                            {(task.status === 'downloading' || task.status === 'paused') && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <ProgressBar value={task.progress} max={100} color={task.status === 'paused' ? 'warning' : 'brand'} />
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
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <Text size={200} style={{ color: tokens.colorPaletteGreenForeground1 }}>{t('completed') || 'Completed'}</Text>
                                                    {task.manifest && (
                                                        <Button size="small" appearance="outline" onClick={() => {
                                                            providerAddTask(task.pluginId, task.pluginName, task.version, true, task.url);
                                                        }}>{t('save') || 'Save'}</Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PopoverSurface>
                    </Popover>
                )}
                <Button
                    aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
                    icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
                    appearance="subtle"
                    onClick={toggleTheme}
                    title={isDark ? 'Light mode' : 'Dark mode'}
                    className={styles.actionButton}
                />
                <Menu>
                    <MenuTrigger disableButtonEnhancement>
                        <Button aria-label="Change language" icon={<TranslateRegular />} appearance="subtle" className={styles.actionButton} />
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem onClick={() => setLocale('zh_CN')}>中文 (简体)</MenuItem>
                            <MenuItem onClick={() => setLocale('en_US')}>English (US)</MenuItem>
                            <MenuItem onClick={() => setLocale('en_UK')}>English (UK)</MenuItem>
                            <MenuItem onClick={() => setLocale('en')}>English</MenuItem>
                            <MenuItem onClick={() => setLocale('fr')}>Français</MenuItem>
                            <MenuItem onClick={() => setLocale('du')}>Dutch / Deutsch</MenuItem>
                            <MenuItem onClick={() => setLocale('jp')}>日本語</MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </div>
        </header>
    );
}
