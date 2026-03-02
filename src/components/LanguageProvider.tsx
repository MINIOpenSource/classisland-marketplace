'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import en_US from '../messages/en_US.json';
import zh_CN from '../messages/zh_CN.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messagesMap: Record<string, any> = {
    en_US,
    zh_CN
};

type LocaleContextType = {
    locale: string;
    setLocale: (locale: string) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LanguageProvider');
    }
    return context;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<string>('en_US');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        /* eslint-disable */
        // 1. Check local storage
        const saved = localStorage.getItem('NEXT_LOCALE');
        if (saved && messagesMap[saved]) {
            setLocaleState(saved);
        } else {
            // 2. Check browser language (zh-CN or similar defaults to zh_CN)
            const browserLang = navigator.language || navigator.languages?.[0];
            if (browserLang && browserLang.toLowerCase().includes('zh')) {
                setLocaleState('zh_CN');
                localStorage.setItem('NEXT_LOCALE', 'zh_CN');
            } else {
                setLocaleState('en_US');
                localStorage.setItem('NEXT_LOCALE', 'en_US');
            }
        }
        setMounted(true);
        /* eslint-enable */
    }, []);

    const setLocale = (newLocale: string) => {
        setLocaleState(newLocale);
        localStorage.setItem('NEXT_LOCALE', newLocale);
    };

    if (!mounted) {
        // Avoid server-client hydration mismatch but provide empty/default context
        return (
            <LocaleContext.Provider value={{ locale: 'en_US', setLocale: () => { } }}>
                <NextIntlClientProvider locale="en-US" messages={messagesMap['en_US']} timeZone="Asia/Shanghai">
                    <div style={{ visibility: 'hidden' }}>{children}</div>
                </NextIntlClientProvider>
            </LocaleContext.Provider>
        );
    }

    return (
        <LocaleContext.Provider value={{ locale, setLocale }}>
            <NextIntlClientProvider locale={locale.replace('_', '-')} messages={messagesMap[locale]} timeZone="Asia/Shanghai">
                {children}
            </NextIntlClientProvider>
        </LocaleContext.Provider>
    );
}
