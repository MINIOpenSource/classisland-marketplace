import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import { getPluginIndex } from '@/services/pluginIndex';
import fs from 'fs';
import path from 'path';

function toSafePluginId(pluginId: string): string {
    return pluginId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const dynamic = 'force-static';

export async function GET() {
    const data = await getPluginIndex();
    const filteredData = JSON.parse(JSON.stringify(data));

    if (process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true') {
        const CIPX_DIR = path.join(process.cwd(), '.plugin-cache', 'cipx');
        if (filteredData.Plugins) {
            filteredData.Plugins = filteredData.Plugins.filter((plugin: { Manifest?: { Id: string } }) => {
                const id = plugin.Manifest?.Id;
                if (!id) return true;

                const safeId = toSafePluginId(id);
                const cipxPath = path.join(CIPX_DIR, `${safeId}.cipx`);

                if (fs.existsSync(cipxPath)) {
                    const stats = fs.statSync(cipxPath);
                    if (stats.size > 24 * 1024 * 1024) {
                        return false;
                    }
                }

                return true;
            });
        }
    }

    const zip = new AdmZip();
    zip.addFile('index.v2.json', Buffer.from(JSON.stringify(filteredData, null, 2), 'utf-8'));

    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer as unknown as BodyInit, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="index.zip"',
        },
    });
}
