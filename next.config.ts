/** @type {import('next').NextConfig} */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure data and speedtest files are generated before the build starts 
// (especially for platforms like Cloudflare Pages that run `npx next build` directly)
try {
    if (!fs.existsSync(path.join(process.cwd(), 'src/data/commits.json'))) {
        execSync('node scripts/fetch-commits.mjs', { stdio: 'inherit' });
    }
    if (!fs.existsSync(path.join(process.cwd(), 'public/speedtest'))) {
        execSync('node scripts/generate-speedtest.mjs', { stdio: 'inherit' });
    }
} catch (e) {
    console.warn('Failed to generate pre-build files:', e);
}

const isLimitedCipx = process.env.LIMIT_HISTORICAL_CIPX === '1';
const platformName = process.env.VERCEL ? 'Vercel' :
    process.env.CF_PAGES ? 'Cloudflare Pages' :
        process.env.GITHUB_PAGES ? 'GitHub Pages' : 'Local / Unknown';

console.log(`=========================================`);
console.log(`[ClassIsland Marketplace Build]`);
console.log(`- Platform:            ${platformName}`);
console.log(`- Env detected:        ${isLimitedCipx ? 'Historical Limit Enabled' : 'Full Version Cache'}`);
console.log(`=========================================`);


let buildHash = 'unknown';
try {
    const defaultHash = process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
    buildHash = defaultHash ? defaultHash.substring(0, 7) : execSync('git rev-parse --short HEAD').toString().trim();
} catch { }

interface Commit {
    shortHash: string;
    hash: string;
    message: string;
    date: string;
    author: string;
}

let commitHistory: Commit[] = [];
try {
    const log = execSync("git log -n 50 --pretty=format:\"%h|%H|%s|%ad|%an\" --date=short --abbrev=8").toString();
    commitHistory = log.split('\n').filter(Boolean).map(line => {
        const [shortHash, hash, msg, date, author] = line.split('|');
        return { shortHash, hash, message: msg, date, author };
    });
} catch { }

const nextConfig = {
    output: 'export',
    env: {
        BUILD_TIME: new Date().toISOString(),
        BUILD_HASH: buildHash,
        CF_PAGES: process.env.CF_PAGES || '',
        VERCEL: process.env.VERCEL || '',
        GITHUB_PAGES: process.env.GITHUB_PAGES || '',
        IS_DEV: process.env.NODE_ENV === 'development' ? 'true' : 'false',
        COMMIT_HISTORY: JSON.stringify(commitHistory),
        CF_PAGES_URL: process.env.CF_PAGES_URL || '',
        VERCEL_URL: process.env.VERCEL_URL || '',
        GITHUB_PAGES_URL: process.env.GITHUB_PAGES_URL || '',
        NEXT_PUBLIC_LIMIT_HISTORICAL_CIPX: process.env.LIMIT_HISTORICAL_CIPX === '1' ? 'true' : 'false',
    },
    experimental: {
        viewTransition: true
    }
};

export default nextConfig;
