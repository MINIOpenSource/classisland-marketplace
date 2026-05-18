import { PageTransition } from '@/components/PageTransition';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--colorNeutralBackground1)' }}>
            <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <PageTransition>{children}</PageTransition>
            </main>
        </div>
    );
}
