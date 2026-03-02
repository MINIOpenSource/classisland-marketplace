import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { PageTransition } from '@/components/PageTransition';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
        <html lang="en">
            <body>
                <LanguageProvider>
                    <ThemeProvider>
                        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                            <Header />
                            <main style={{ padding: '0 24px 80px 24px', flexGrow: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                                <PageTransition>{children}</PageTransition>
                            </main>
                            <Footer />
                        </div>
                    </ThemeProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
