'use client';

import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
    createDOMRenderer,
    RendererProvider,
    SSRProvider,
    renderToStyleElements
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useTranslations } from 'next-intl';

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

    const toggleTheme = useCallback((e?: React.MouseEvent) => {
        setIsDark(prev => {
            const next = !prev;
            if (prev === true && next === false) {
                const confirmed = window.confirm(t('lightModeConfirm') || "You are about to switch to light mode, are you sure you want to blind yourself?");
                if (!confirmed) return prev;
            }

            if (e && typeof document !== 'undefined') {
                const x = e.clientX;
                const y = e.clientY;
                setAnimContext({ x, y, isDarkNow: prev });
                setIsAnimating(true);

                // Set the theme class to body for global styles if needed
                document.documentElement.classList.toggle('dark', next);

                setTimeout(() => {
                    localStorage.setItem('theme', next ? 'dark' : 'light');
                    setIsAnimating(false);
                    setAnimContext(null);
                }, 500); // Wait for transition
            } else {
                localStorage.setItem('theme', next ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', next);
            }

            return next;
        });
    }, [t]);

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
                        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
                    </FluentProvider>
                </SSRProvider>
            </RendererProvider>
        </ThemeContext.Provider>
    );
}
