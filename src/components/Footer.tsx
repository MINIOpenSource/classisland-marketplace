'use client';

import { useState, useEffect } from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import packageJson from '../../package.json';
import Link from 'next/link';

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
        textDecoration: 'none',
    },
    versionLink: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
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
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    const isGitHubPages = process.env.GITHUB_PAGES === '1' || process.env.GITHUB_PAGES === 'true';
    const buildHash = process.env.BUILD_HASH;
    const buildTime = process.env.BUILD_TIME;

    const [timeFormat, setTimeFormat] = useState<'locale' | 'relative'>('locale');
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    let displayTime = buildTime;
    if (mounted && buildTime) {
        try {
            const date = new Date(buildTime);
            if (timeFormat === 'locale') {
                displayTime = date.toLocaleString();
            } else {
                const diff = (now - date.getTime()) / 1000;
                if (diff < 60) displayTime = '刚刚';
                else if (diff < 3600) displayTime = `${Math.floor(diff / 60)} 分钟前`;
                else if (diff < 86400) displayTime = `${Math.floor(diff / 3600)} 小时前`;
                else displayTime = `${Math.floor(diff / 86400)} 天前`;
            }
        } catch { }
    }

    const handleTimeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setTimeFormat(prev => prev === 'locale' ? 'relative' : 'locale');
    };

    return (
        <footer className={styles.footer} style={{ backgroundColor: 'color-mix(in srgb, var(--colorNeutralBackground1) 75%, transparent)' }}>
            <Link href="/about" className={styles.versionLink}>
                <Text size={300}>ClassIsland Marketplace v{packageJson.version}</Text>
                {isDev && (
                    <Text size={200} weight="semibold" className={styles.warning}>
                        开发中版本，不代表最终效果
                    </Text>
                )}
                {!isDev && (
                    <Text size={200} className={styles.info}>
                        Build at <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={handleTimeClick}>{displayTime}</span> (<a href={`https://github.com/MINIOpenSource/classisland-marketplace/commit/${buildHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{buildHash?.substring(0, 7) || buildHash}</a>)
                    </Text>
                )}
                {isCFPages && (
                    <Text size={200} className={styles.info}>
                        Deployed on Cloudflare Pages
                    </Text>
                )}
                {isVercel && (
                    <Text size={200} className={styles.info}>
                        Deployed on Vercel
                    </Text>
                )}
                {isGitHubPages && (
                    <Text size={200} className={styles.info}>
                        Deployed on GitHub Pages
                    </Text>
                )}
                {process.env.NEXT_PUBLIC_LIMIT_HISTORICAL_CIPX === 'true' && (
                    <Text size={200} className={styles.info}>
                        Historical Plugin Version Cache Limited
                    </Text>
                )}
            </Link>
            <div style={{ marginTop: '8px' }}>
                <Link href="/v2" style={{ color: 'var(--colorBrandForegroundLink)', fontSize: '12px', textDecoration: 'none' }}>
                    🚀 Try Marketplace 2.0 (Beta)
                </Link>
            </div>
        </footer>
    );
}
