import { NextRequest } from 'next/server';
import { getPluginById } from '@/services/pluginIndex';
import { getPluginIndex } from '@/services/pluginIndex';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = 3600;

const CARD_WIDTH = 400;
const CARD_HEIGHT = 180;

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
}) {
    const name = escapeXml(truncate(plugin.Manifest.Name || plugin.Manifest.Id, 24));
    const author = escapeXml(truncate(plugin.Manifest.Author || 'Anonymous', 20));
    const version = escapeXml(truncate(plugin.Manifest.Version || '0.0.0', 16));
    const pluginId = escapeXml(truncate(plugin.Manifest.Id, 30));
    const downloadCount = escapeXml(formatCount(plugin.DownloadCount || 0));
    const starsCount = escapeXml(formatCount(plugin.StarsCount || 0));
    const iconHref = escapeXml(resolveIconUrl(plugin));

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="400" y2="180" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F8FAFC"/>
    </linearGradient>
    <linearGradient id="hintBg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#DCEEFB"/>
      <stop offset="1" stop-color="#DBEAFE"/>
    </linearGradient>
    <clipPath id="iconClip">
      <rect x="20" y="20" width="56" height="56" rx="12"/>
    </clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="399" height="179" rx="12" fill="url(#bg)" stroke="#E5E7EB"/>
  <rect x="20" y="20" width="56" height="56" rx="12" fill="#EEF2FF"/>
  <image href="${iconHref}" x="20" y="20" width="56" height="56" preserveAspectRatio="xMidYMid slice" clip-path="url(#iconClip)"/>
  <text x="88" y="42" fill="#111827" font-size="18" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${name}</text>
  <text x="88" y="63" fill="#6B7280" font-size="12" font-family="Segoe UI, Arial, sans-serif">${author} • v${version}</text>
  <text x="88" y="82" fill="#9CA3AF" font-size="11" font-family="Consolas, Menlo, monospace">${pluginId}</text>

  <rect x="286" y="20" width="94" height="56" rx="10" fill="#F3F4F6"/>
  <text x="298" y="42" fill="#6B7280" font-size="12" font-family="Segoe UI, Arial, sans-serif">Downloads</text>
  <text x="298" y="59" fill="#111827" font-size="14" font-weight="600" font-family="Segoe UI, Arial, sans-serif">${downloadCount}</text>
  <text x="346" y="42" fill="#6B7280" font-size="12" font-family="Segoe UI, Arial, sans-serif">Stars</text>
  <text x="346" y="59" fill="#111827" font-size="14" font-weight="600" font-family="Segoe UI, Arial, sans-serif">${starsCount}</text>

  <line x1="20" y1="102" x2="380" y2="102" stroke="#E5E7EB"/>
  <rect x="20" y="116" width="116" height="30" rx="15" fill="url(#hintBg)"/>
  <text x="34" y="136" fill="#1D4ED8" font-size="12" font-weight="600" font-family="Segoe UI, Arial, sans-serif">点击跳转</text>
  <text x="320" y="136" fill="#9CA3AF" font-size="12" font-family="Segoe UI, Arial, sans-serif">↗</text>
</svg>`;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const plugin = await getPluginById(id);

    if (!plugin) {
        return new Response('Not Found', { status: 404 });
    }

    const svg = buildSvg(plugin);

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
