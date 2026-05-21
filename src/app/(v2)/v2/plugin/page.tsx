
import { getPluginIndex } from '@/services/pluginIndex';
import { fetchRatings } from '@/services/interactiveAPI';

export default async function V2PluginPage() {
    let data = null;
    try {
        data = await getPluginIndex();

        if (data && data.Plugins) {
            const pluginIds = data.Plugins.filter((p: any) => p.Manifest && p.Manifest.Id).map((p: any) => p.Manifest.Id);
            try {
                const ratings: Record<string, any> = {};
                for (let i = 0; i < pluginIds.length; i += 100) {
                    const batch = pluginIds.slice(i, i + 100);
                    const batchRatings = await fetchRatings(batch);
                    Object.assign(ratings, batchRatings);
                }

                data.Plugins = data.Plugins.map((p: any) => {
                    if (p.Manifest && p.Manifest.Id && ratings[p.Manifest.Id]) {
                        const stats = ratings[p.Manifest.Id];
                        let totalVotes = 0;
                        let totalScore = 0;
                        for (let i = 1; i <= 10; i++) {
                            const count = stats[i] || 0;
                            totalVotes += count;
                            totalScore += count * i;
                        }
                        const average5Star = totalVotes > 0 ? (totalScore / totalVotes / 2) : 0;
                        p.Rating = average5Star;
                        p.RatingCount = totalVotes;
                    }
                    return p;
                });
            } catch (e) {
                console.warn('Failed to fetch ratings for V2 page:', e);
            }
        }
    } catch (error) {
        console.error(error);
    }

    const plugins = data ? data.Plugins.filter((p: any) => p.Manifest && p.Manifest.Id) : [];

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 2rem', background: '#fafafa', minHeight: '100vh', color: '#111' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '3rem', borderBottom: '4px solid #111', display: 'inline-block' }}>Discover Plugins</h1>

                <div className="v2-plugin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
                    {plugins.map((plugin: any) => (
                        <a key={plugin.Manifest.Id} href={`/v2/plugin/${plugin.Manifest.Id}`} style={{
                            display: 'block',
                            background: 'white',
                            borderRadius: '24px',
                            padding: '2rem',
                            textDecoration: 'none',
                            color: 'inherit',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                        }}>
                            <img src={plugin.CachedIconFile || '/favicon.ico'} style={{ width: '64px', height: '64px', borderRadius: '16px', marginBottom: '1.5rem' }} />
                            <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>{plugin.Manifest.Name}</h2>
                            <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 1.5rem 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{plugin.Manifest.Description}</p>

                            <div style={{ display: 'flex', gap: '1rem', color: '#999', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                <span>v{plugin.Manifest.Version}</span>
                                {plugin.Rating !== undefined && plugin.RatingCount > 0 ? (
                                    <span style={{color: '#ffb400'}}>★ {plugin.Rating.toFixed(1)}</span>
                                ) : (
                                    <span>★ {plugin.StarsCount}</span>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
