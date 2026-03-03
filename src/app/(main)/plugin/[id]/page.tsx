import { getPluginById, getReadmeContent, getPluginIndex, getPluginVersionHistory } from '@/services/pluginIndex';
import { PluginDetailClient } from '@/components/PluginDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
    const data = await getPluginIndex();
    return data.Plugins
        .filter((p: { Manifest?: { Id?: string } }) => p.Manifest && p.Manifest.Id)
        .map((p: { Manifest?: { Id?: string } }) => ({
            id: p.Manifest!.Id,
        }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const plugin = await getPluginById(id);
    if (!plugin) {
        return { title: 'Plugin Not Found - ClassIsland Marketplace' };
    }
    return {
        title: `${plugin.Manifest.Name} - ClassIsland Marketplace`,
        description: plugin.Manifest.Description || `${plugin.Manifest.Name} plugin for ClassIsland`,
    };
}

export default async function PluginPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const plugin = await getPluginById(id);
    if (!plugin) {
        notFound();
    }

    // Try cached readme first, then fetch from remote
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

    // Fetch version history from GitHub releases
    const versionHistory = await getPluginVersionHistory(
        id,
        plugin.DownloadUrl,
        plugin.Manifest?.Url
    );

    return (
        <PluginDetailClient plugin={plugin} readmeContent={readmeContent} versionHistory={versionHistory} />
    );
}

