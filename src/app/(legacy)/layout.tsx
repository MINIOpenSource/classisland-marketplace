import { PageTransition } from '@/components/PageTransition';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TopBarProvider } from '@/components/TopBarProvider';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TopBarProvider>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <main style={{ padding: '0 24px 80px 24px', flexGrow: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
            </div>
        </TopBarProvider>
    );
}
