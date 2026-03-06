/** @type {import('next').NextConfig} */
import { execSync } from 'child_process';

let buildHash = 'unknown';
try {
    const defaultHash = process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
    buildHash = defaultHash ? defaultHash.substring(0, 7) : execSync('git rev-parse --short HEAD').toString().trim();
} catch { }

let commitHistory: any[] = [];
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
        IS_DEV: process.env.NODE_ENV === 'development' ? 'true' : 'false',
        COMMIT_HISTORY: JSON.stringify(commitHistory),
        CF_PAGES_URL: process.env.CF_PAGES_URL || '',
        VERCEL_URL: process.env.VERCEL_URL || '',
    },
    experimental: {
        viewTransition: true
    }
};

export default nextConfig;
