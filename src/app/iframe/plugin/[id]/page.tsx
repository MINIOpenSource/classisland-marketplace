import { getPluginById } from '@/services/pluginIndex';
import { notFound } from 'next/navigation';
import { IframePluginClient } from '@/components/IframePluginClient';
import type { Metadata } from 'next';
import { getPluginIndex } from '@/services/pluginIndex';

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
    };
}

export default async function IframePluginPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const plugin = await getPluginById(id);

    if (!plugin) {
        notFound();
    }

    return <IframePluginClient plugin={plugin} />;
}
