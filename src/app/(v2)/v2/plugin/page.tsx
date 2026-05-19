import { getPluginIndex } from '@/services/pluginIndex';
import { PluginData } from '@/components/PluginCard';
import { PluginBrowser } from '@/components/PluginBrowser';
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

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px' }}>Plugins (Beta)</h1>
            {data ? (
                <div className="v2-marketplace-wrapper">
                <div className="v2-marketplace-wrapper">
                <PluginBrowser plugins={data.Plugins.filter((p: PluginData) => p.Manifest && p.Manifest.Id)} />
            </div>
            </div>
            ) : (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                    <p>Failed to load plugins.</p>
                </div>
            )}
        </div>
    );
}
