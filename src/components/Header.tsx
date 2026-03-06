'use client';

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
    Badge
} from '@fluentui/react-components';
import { TranslateRegular, WeatherSunnyRegular, WeatherMoonRegular } from '@fluentui/react-icons';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';

const useStyles = makeStyles({
    header: {
        height: '72px',
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

    return (
        <header className={styles.header}>
            <div className={styles.titleWrap}>
                <Avatar className={styles.logoAvatar} image={{ src: '/favicon.ico' }} name="ClassIsland" shape="square" size={32} />
                <Title1 as="h1" className={styles.titleText}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span className={styles.desktopText}>ClassIsland </span>
                        Marketplace
                    </span>
                    <Badge appearance="tint" shape="rounded" color="brand" style={{ fontSize: '12px', paddingTop: '2px', flexShrink: 0 }}>{t('preview')}</Badge>
                </Title1>
            </div>
            <div className={styles.actions}>
                <Button
                    icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
                    appearance="subtle"
                    onClick={toggleTheme}
                    title={isDark ? 'Light mode' : 'Dark mode'}
                    className={styles.actionButton}
                />
                <Menu>
                    <MenuTrigger disableButtonEnhancement>
                        <Button icon={<TranslateRegular />} appearance="subtle" className={styles.actionButton} />
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
