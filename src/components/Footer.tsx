'use client';

import { makeStyles, tokens, Text } from '@fluentui/react-components';
import packageJson from '../../package.json';

const useStyles = makeStyles({
    footer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 700,
        padding: '8px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        color: tokens.colorNeutralForeground3,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
        backdropFilter: 'blur(10px)',
    },
    warning: {
        color: tokens.colorPaletteRedForeground1,
    },
    info: {
        color: tokens.colorNeutralForeground4,
        fontSize: '10px',
    }
});

export function Footer() {
    const styles = useStyles();
    const isDev = process.env.IS_DEV === 'true';
    const isCFPages = process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true';
    const buildHash = process.env.BUILD_HASH;
    const buildTime = process.env.BUILD_TIME;

    // We can format the date to local string if we want, or just leave ISO
    // But hydration might mismatch if we format blindly. ISO string is safe.

    return (
        <footer className={styles.footer}>
            <Text size={300}>ClassIsland Marketplace v{packageJson.version}</Text>
            {isDev && (
                <Text size={200} weight="semibold" className={styles.warning}>
                    开发中版本，不代表最终效果
                </Text>
            )}
            {!isDev && (
                <Text size={200} className={styles.info}>
                    Build at {buildTime} ({buildHash})
                </Text>
            )}
            {isCFPages && (
                <Text size={200} className={styles.info}>
                    Deployed on Cloudflare Pages
                </Text>
            )}
        </footer>
    );
}
