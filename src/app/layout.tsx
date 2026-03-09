import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import '@/app/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ClassIsland Marketplace',
    description: 'Discover and download plugins for ClassIsland',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#ffffff" />
            </head>
            <body suppressHydrationWarning>
                <LanguageProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </LanguageProvider>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                    }, function(err) {
                                        console.log('ServiceWorker registration failed: ', err);
                                    });
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
