'use client';

import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
    createDOMRenderer,
    RendererProvider,
    SSRProvider,
    renderToStyleElements,
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogContent,
    DialogActions,
    Button
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';
import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { DownloadProvider } from './DownloadProvider';

interface ThemeContextValue {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => { } });

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [renderer] = useState(() => createDOMRenderer());
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    const t = useTranslations('Index');

    useEffect(() => {
        /* eslint-disable */
        setMounted(true);
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            setIsDark(true);
        } else if (saved === 'light') {
            setIsDark(false);
        } else {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            setIsDark(mql.matches);
            const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
            mql.addEventListener('change', handler);
            /* eslint-enable */
            return () => mql.removeEventListener('change', handler);
        }
    }, []);

    const [confirmLightModeOpen, setConfirmLightModeOpen] = useState(false);
    const confirmSwitchRef = useRef<{ e?: React.MouseEvent } | null>(null);

    const performThemeSwitch = useCallback((next: boolean) => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next);
            localStorage.setItem('theme', next ? 'dark' : 'light');
        }
        setIsDark(next);
    }, []);

    const toggleTheme = useCallback((e?: React.MouseEvent) => {
        setIsDark(prev => {
            const next = !prev;
            if (prev === true && next === false) {
                confirmSwitchRef.current = { e };
                setConfirmLightModeOpen(true);
                return prev;
            }
            performThemeSwitch(next);
            return next;
        });
    }, [performThemeSwitch]);

    const handleConfirmLightMode = () => {
        setConfirmLightModeOpen(false);
        if (confirmSwitchRef.current) {
            performThemeSwitch(false);
            confirmSwitchRef.current = null;
        }
    };

    useServerInsertedHTML(() => {
        // Only insert styles on the server
        if (typeof window === 'undefined') {
            const styles = renderToStyleElements(renderer);
            return <>{styles}</>;
        }
    });

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <RendererProvider renderer={renderer}>
                <SSRProvider>
                    <FluentProvider
                        suppressHydrationWarning
                        theme={isDark ? webDarkTheme : webLightTheme}
                        style={{
                            minHeight: '100vh',
                            backgroundColor: isDark ? webDarkTheme.colorNeutralBackground2 : webLightTheme.colorNeutralBackground2,
                            transition: 'background-color 0.5s ease',
                            position: 'relative',
                            overflow: 'visible'
                        }}
                    >
                        {mounted ? (
                            <DownloadProvider>
                                {children}
                            </DownloadProvider>
                        ) : <div style={{ visibility: 'hidden' }}>{children}</div>}

                        <Dialog open={confirmLightModeOpen} onOpenChange={(_, data) => !data.open && setConfirmLightModeOpen(false)}>
                            <DialogSurface>
                                <DialogBody>
                                    <DialogTitle>{t('lightModeConfirmTitle') || 'Danger Zone'}</DialogTitle>
                                    <DialogContent>
                                        {t('lightModeConfirm') || "You are about to switch to light mode, are you sure you want to blind yourself?"}
                                    </DialogContent>
                                    <DialogActions>
                                        <Button appearance="secondary" onClick={() => setConfirmLightModeOpen(false)}>
                                            {t('cancel') || 'Cancel'}
                                        </Button>
                                        <Button appearance="primary" onClick={handleConfirmLightMode}>
                                            {t('confirm') || 'Confirm'}
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                    </FluentProvider>
                </SSRProvider>
            </RendererProvider>
        </ThemeContext.Provider>
    );
}
