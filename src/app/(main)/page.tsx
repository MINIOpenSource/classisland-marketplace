import { getPluginIndex } from '@/services/pluginIndex';
import { PluginData } from '@/components/PluginCard';
import { PluginBrowser } from '@/components/PluginBrowser';

export default async function HomePage() {
    let data = null;
    try {
        data = await getPluginIndex();
    } catch (error) {
        console.error(error);
    }

    return (
        data ? (
            <PluginBrowser plugins={data.Plugins.filter((p: PluginData) => p.Manifest && p.Manifest.Id)} />
        ) : (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <p>Failed to load plugins.</p>
            </div>
        )
    );
}
