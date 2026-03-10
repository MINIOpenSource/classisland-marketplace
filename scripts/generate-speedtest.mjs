import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const outputDir = path.join(process.cwd(), 'public', 'speedtest');

function generateSpeedtest() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const sizes = new Array(192).fill(96 * 1024);
    let remainingBytes = 64 * 1024 * 1024 - (192 * 96 * 1024);

    while (remainingBytes > 0) {
        const i = Math.floor(Math.random() * 192);
        if (sizes[i] < 384 * 1024) {
            const space = (384 * 1024) - sizes[i];
            const maxAdd = Math.min(space, remainingBytes, 16 * 1024);
            const add = Math.floor(Math.random() * maxAdd) + 1;
            sizes[i] += add;
            remainingBytes -= add;
        }
    }

    const chunks = [];
    for (let i = 0; i < 192; i++) {
        const filename = `${String(i).padStart(4, '0')}.bin`;
        const filePath = path.join(outputDir, filename);
        const buf = crypto.randomBytes(sizes[i]);
        fs.writeFileSync(filePath, buf);
        chunks.push(`/speedtest/${filename}`);
    }
    const manifest = { chunks };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('ClassIsland Marketplace: Generated 192 random bin files (total 64MB) for speed test.');
}

generateSpeedtest();
