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
    logoAvatar: {
        boxShadow: tokens.shadow8,
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
                <Title1 as="h1" style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ClassIsland Marketplace
                    <Badge appearance="tint" shape="rounded" color="brand" style={{ fontSize: '14px', paddingTop: '2px' }}>{t('preview')}</Badge>
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
                            <MenuItem onClick={() => setLocale('en_US')}>English</MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </div>
        </header>
    );
}
