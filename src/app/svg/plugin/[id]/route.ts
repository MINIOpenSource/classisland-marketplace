import { NextRequest } from 'next/server';
import { getPluginById } from '@/services/pluginIndex';
import { getPluginIndex } from '@/services/pluginIndex';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = 3600;

const CARD_WIDTH = 400;
const CARD_HEIGHT = 100;

function escapeXml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function truncate(value: string, length: number): string {
    if (value.length <= length) return value;
    return `${value.slice(0, Math.max(0, length - 1))}…`;
}

function formatCount(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${value}`;
}

function resolveIconUrl(plugin: {
    CachedIconFile?: string;
    RealIconPath?: string;
}): string {
    if (plugin.CachedIconFile) {
        return `/icons/${encodeURIComponent(plugin.CachedIconFile)}`;
    }
    if (plugin.RealIconPath) {
        return plugin.RealIconPath;
    }
    return '/favicon.ico';
}

function buildSvg(plugin: {
    Manifest: { Id: string; Name: string; Version: string; Author: string };
    DownloadCount: number;
    StarsCount: number;
    CachedIconFile?: string;
    RealIconPath?: string;
}, originUrl: string, tAnonymous: string) {
    const name = escapeXml(truncate(plugin.Manifest.Name || plugin.Manifest.Id, 24));
    const author = escapeXml(truncate(plugin.Manifest.Author || tAnonymous, 20));
    const version = escapeXml(truncate(plugin.Manifest.Version || '0.0.0', 16));
    const pluginId = escapeXml(truncate(plugin.Manifest.Id, 30));
    const downloadCount = escapeXml(formatCount(plugin.DownloadCount || 0));
    const starsCount = escapeXml(formatCount(plugin.StarsCount || 0));

    let iconUrl = resolveIconUrl(plugin);
    if (!iconUrl.startsWith('http')) {
        iconUrl = new URL(iconUrl, originUrl).toString();
    }
    const iconHref = escapeXml(iconUrl);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}">
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Google+Sans+Code:wght@400&amp;family=Noto+Sans+SC:wght@400;600&amp;family=Noto+Sans:wght@400;600&amp;display=swap");
  
    .bg { fill: #ffffff; }
    .border { stroke: #e0e0e0; stroke-width: 1; }
    .shadow { filter: drop-shadow(0px 1.6px 3.6px rgba(0,0,0,0.13)) drop-shadow(0px 0.3px 0.9px rgba(0,0,0,0.11)); }
    .title { fill: #242424; font-family: "Noto Sans SC", "Noto Sans", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; }
    .subtitle { fill: #616161; font-family: "Noto Sans SC", "Noto Sans", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; }
    .id { fill: #8a8a8a; font-family: "Google Sans Code", Consolas, "Courier New", monospace; font-size: 12px; font-weight: 400; }
    .stat-bg { fill: #f5f5f5; }
    .stat-text { fill: #424242; font-family: "Noto Sans SC", "Noto Sans", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; }
    .icon { stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    
    @media (prefers-color-scheme: dark) {
      .bg { fill: #292929; }
      .border { stroke: #424242; stroke-width: 1; }
      .shadow { filter: drop-shadow(0px 1.6px 3.6px rgba(0,0,0,0.4)) drop-shadow(0px 0.3px 0.9px rgba(0,0,0,0.3)); }
      .title { fill: #ffffff; }
      .subtitle { fill: #c0c0c0; }
      .id { fill: #9e9e9e; }
      .stat-bg { fill: #333333; }
      .stat-text { fill: #c0c0c0; }
    }
  </style>

  <g class="shadow">
    <rect x="0.5" y="0.5" width="${CARD_WIDTH - 1}" height="${CARD_HEIGHT - 1}" rx="8" class="bg border"/>

    <g transform="translate(16, 16)">
        <clipPath id="logoClip"><rect x="0" y="0" width="56" height="56" rx="4" /></clipPath>
        <image href="${iconHref}" x="0" y="0" width="56" height="56" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)"/>

        <text x="68" y="15" dominant-baseline="hanging" class="title">${name}</text>
        <text x="68" y="37" dominant-baseline="hanging" class="subtitle">${author} <tspan fill="#616161">•</tspan> v${version}</text>
        <text x="68" y="55" dominant-baseline="hanging" class="id">${pluginId}</text>
    </g>
    
    <g transform="translate(316, 16)">
        <rect x="0" y="0" width="68" height="68" rx="8" class="stat-bg"/>
        
        <g transform="translate(12, 8)">
            <svg width="14" height="14" viewBox="0 0 24 24" class="subtitle icon">
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
                <line x1="4" y1="21" x2="20" y2="21"></line>
            </svg>
            <text x="20" y="11.5" dominant-baseline="middle" class="stat-text">${downloadCount}</text>
        </g>
        
        <g transform="translate(12, 27)">
            <svg width="14" height="14" viewBox="0 0 24 24" class="subtitle icon">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <text x="20" y="11.5" dominant-baseline="middle" class="stat-text">${starsCount}</text>
        </g>

        <g transform="translate(12, 46)">
            <svg width="14" height="14" viewBox="0 0 24 24" class="subtitle icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <text x="20" y="11.5" dominant-baseline="middle" class="stat-text">-</text>
        </g>
    </g>
  </g>
</svg>`;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const plugin = await getPluginById(id);

    if (!plugin) {
        return new Response('Not Found', { status: 404 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://marketplace.classisland.tech';

    // Read cookie for locale or use default
    // We'll just hardcode Anonymous since we don't have next-intl here, but ideally we match user lang.
    const svg = buildSvg(plugin, origin, 'Anonymous');

    return new Response(svg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}

export async function generateStaticParams() {
    const data = await getPluginIndex();
    return data.Plugins
        .filter((p: { Manifest?: { Id?: string } }) => p.Manifest && p.Manifest.Id)
        .map((p: { Manifest?: { Id?: string } }) => ({
            id: p.Manifest!.Id!,
        }));
}
