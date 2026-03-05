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

    const toggleTheme = useCallback(() => {
        setIsDark(prev => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            return next;
        });
    }, []);

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
                        style={{ minHeight: '100vh', backgroundColor: isDark ? webDarkTheme.colorNeutralBackground2 : webLightTheme.colorNeutralBackground2 }}
                    >
                        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
                    </FluentProvider>
                </SSRProvider>
            </RendererProvider>
        </ThemeContext.Provider>
    );
}
