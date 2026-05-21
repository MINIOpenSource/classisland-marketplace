import { getPluginById, getReadmeContent, getPluginVersionHistory, getPluginIndex } from '@/services/pluginIndex';
import { fetchReviews } from '@/services/interactiveAPI';
import { notFound } from 'next/navigation';
import { PluginDetailV2Client } from '@/components/v2/PluginDetailV2Client';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';


export async function generateStaticParams() {
    const data = await getPluginIndex();
    return data.Plugins
        .filter((p: { Manifest?: { Id?: string } }) => p.Manifest && p.Manifest.Id)
        .map((p: { Manifest?: { Id?: string } }) => ({
            id: p.Manifest!.Id,
        }));
}

export default async function V2PluginDetailPage({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const plugin = await getPluginById(id);
    if (!plugin) {
        notFound();
    }

    let readmeContent = getReadmeContent(id) || "";
    if (!readmeContent && plugin.Manifest?.Readme) {
        try {
            const res = await fetch(plugin.Manifest.Readme, { next: { revalidate: 3600 } });
            if (res.ok) {
                readmeContent = await res.text();
            }
        } catch (e) {
            console.error("Failed to fetch readme:", e);
        }
    }

    const readmeNode = <MarkdownRenderer content={readmeContent} pluginDescription={plugin.Manifest?.Description} />;

    const isCFPages = process.env.NEXT_PUBLIC_CF_PAGES === 'true' || process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true';
    const versionHistory = await getPluginVersionHistory(
        id,
        plugin.DownloadUrl,
        plugin.Manifest?.Url
    );

    let reviewsData = null;
    try {
        reviewsData = await fetchReviews(id);
    } catch (e) {
        console.warn('Failed to fetch reviews:', e);
    }

    return (
        <PluginDetailV2Client
            plugin={plugin}
            readmeNode={readmeNode}
            versionHistory={versionHistory}
            reviewsData={reviewsData}
            isCFPages={isCFPages}
        />
    );
}
