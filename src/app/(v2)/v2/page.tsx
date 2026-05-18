'use client';
import Link from 'next/link';

export default function V2HomePage() {
    return (
        <div style={{ padding: '48px', textAlign: 'center' }}>
            <h1 style={{ display: 'block', marginBottom: '16px', fontSize: '2.5rem', fontWeight: 'bold' }}>Marketplace 2.0 Beta</h1>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <Link href="/v2/plugin" style={{ padding: '12px 24px', background: 'var(--colorBrandBackground)', color: 'var(--colorNeutralForegroundOnBrand)', borderRadius: '4px', textDecoration: 'none' }}>Plugins</Link>
                <Link href="/v2/theme" style={{ padding: '12px 24px', background: 'var(--colorNeutralBackground3)', color: 'var(--colorNeutralForeground1)', borderRadius: '4px', textDecoration: 'none' }}>Themes (Beta)</Link>
            </div>
            <div style={{ marginTop: '48px' }}>
                <Link href="/" style={{ color: 'var(--colorBrandForegroundLink)' }}>Return to Legacy Version</Link>
            </div>
        </div>
    );
}
