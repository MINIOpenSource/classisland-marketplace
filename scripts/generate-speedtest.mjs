import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const outputDir = path.join(process.cwd(), 'public', 'speedtest');

function generateSpeedtest() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const chunks = [];
    for (let i = 0; i < 96; i++) {
        const filename = `${String(i).padStart(4, '0')}.bin`;
        const filePath = path.join(outputDir, filename);
        const buf = crypto.randomBytes(192 * 1024);
        fs.writeFileSync(filePath, buf);
        chunks.push(`/speedtest/${filename}`);
    }
    const manifest = { chunks };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('ClassIsland Marketplace: Generated 96 random 192KB bin files for speed test.');
}

generateSpeedtest();
