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
            <body suppressHydrationWarning>
                <LanguageProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
