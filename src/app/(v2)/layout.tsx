import { PageTransition } from '@/components/PageTransition';

export default function V2Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--colorNeutralBackground2)' }}>
            <main style={{ flexGrow: 1 }}>
                <PageTransition>{children}</PageTransition>
            </main>
        </div>
    );
}
