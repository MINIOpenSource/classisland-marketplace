
import Link from 'next/link';

export default function V2HomePage() {
    return (
        <div style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '4rem 2rem',
            color: '#333'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '4rem',
                    fontWeight: '900',
                    letterSpacing: '-0.05em',
                    marginBottom: '1rem',
                    background: '-webkit-linear-gradient(45deg, #000, #444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Marketplace <span style={{color: '#ff3366'}}>2.0</span></h1>
                <p style={{
                    fontSize: '1.2rem',
                    color: '#666',
                    marginBottom: '3rem'
                }}>A completely re-imagined experience for discovering plugins and themes.</p>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    justifyContent: 'center'
                }}>
                    <Link href="/v2/plugin" style={{
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: 'white',
                        background: '#000',
                        borderRadius: '50px',
                        textDecoration: 'none',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}>Browse Plugins</Link>

                    <Link href="/v2/theme" style={{
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#000',
                        background: 'white',
                        border: '2px solid #000',
                        borderRadius: '50px',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                    }}>Explore Themes (Beta)</Link>
                </div>

                <div style={{marginTop: '5rem'}}>
                    <Link href="/" style={{color: '#888', textDecoration: 'underline'}}>← Return to Classic Interface</Link>
                </div>
            </div>
        </div>
    );
}
