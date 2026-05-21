
import { PageTransition } from '@/components/PageTransition';

export default function V2Layout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Custom V2 Header */}
            <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>
                <a href="/v2" style={{ fontWeight: '900', fontSize: '1.5rem', color: '#111', textDecoration: 'none', letterSpacing: '-0.5px' }}>
                    ClassIsland <span style={{color: '#ff3366'}}>2.0</span>
                </a>
                <nav style={{ display: 'flex', gap: '2rem', fontWeight: 'bold' }}>
                    <a href="/v2/plugin" style={{ color: '#666', textDecoration: 'none' }}>Plugins</a>
                    <a href="/v2/theme" style={{ color: '#666', textDecoration: 'none' }}>Themes</a>
                </nav>
            </header>

            <main style={{ flexGrow: 1 }}>
                <PageTransition>{children}</PageTransition>
            </main>
        </div>
    );
}
