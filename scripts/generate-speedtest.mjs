import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const outputDir = path.join(process.cwd(), 'public', 'speedtest');

function generateSpeedtest() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const totalSize = 64 * 1024 * 1024;
    const chunkSize = 192 * 1024;
    const count = Math.ceil(totalSize / chunkSize);
    const sizes = new Array(count).fill(96 * 1024);
    let remainingBytes = totalSize - (count * 96 * 1024);

    while (remainingBytes > 0) {
        const i = Math.floor(Math.random() * count);
        if (sizes[i] < chunkSize * 2) {
            const space = (chunkSize * 2) - sizes[i];
            const maxAdd = Math.min(space, remainingBytes, 16 * 1024);
            const add = Math.floor(Math.random() * maxAdd) + 1;
            sizes[i] += add;
            remainingBytes -= add;
        }
    }

    const chunks = [];
    for (let i = 0; i < count; i++) {
        const filename = `${String(i).padStart(4, '0')}.bin`;
        const filePath = path.join(outputDir, filename);
        const buf = crypto.randomBytes(sizes[i]);
        fs.writeFileSync(filePath, buf);
        chunks.push(`/speedtest/${filename}`);
    }
    const manifest = { chunks, totalSize };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`ClassIsland Marketplace: Generated ${count} random bin files (total 64MB) for speed test.`);
}

generateSpeedtest();
