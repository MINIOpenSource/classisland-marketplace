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
    const [isAnimating, setIsAnimating] = useState(false);
    const [animContext, setAnimContext] = useState<{ x: number, y: number, isDarkNow: boolean } | null>(null);

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

    const performThemeSwitch = useCallback((next: boolean, e?: React.MouseEvent) => {
        if (e && typeof document !== 'undefined') {
            const x = e.clientX;
            const y = e.clientY;
            setAnimContext({ x, y, isDarkNow: !next });
            setIsAnimating(true);
            document.documentElement.classList.toggle('dark', next);
            setTimeout(() => {
                localStorage.setItem('theme', next ? 'dark' : 'light');
                setIsAnimating(false);
                setAnimContext(null);
            }, 500);
        } else {
            localStorage.setItem('theme', next ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', next);
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
            performThemeSwitch(next, e);
            return next;
        });
    }, [performThemeSwitch]);

    const handleConfirmLightMode = () => {
        setConfirmLightModeOpen(false);
        if (confirmSwitchRef.current) {
            performThemeSwitch(false, confirmSwitchRef.current.e);
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
                            transition: isAnimating ? 'none' : 'background-color 0.5s ease',
                            position: 'relative',
                            overflow: isAnimating ? 'hidden' : 'visible'
                        }}
                    >
                        {isAnimating && animContext && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    pointerEvents: 'none',
                                    zIndex: 99999,
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: animContext.y,
                                    left: animContext.x,
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: isDark ? webDarkTheme.colorNeutralBackground2 : webLightTheme.colorNeutralBackground2,
                                    transform: 'translate(-50%, -50%)',
                                    animation: 'themeExpand 0.5s ease-out forwards',
                                }} />
                            </div>
                        )}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes themeExpand {
                                0% {
                                    transform: translate(-50%, -50%) scale(0);
                                    opacity: 0.8;
                                }
                                100% {
                                    transform: translate(-50%, -50%) scale(300);
                                    opacity: 1;
                                }
                            }
                        `}} />
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
