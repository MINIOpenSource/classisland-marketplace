/** @type {import('next').NextConfig} */
import { execSync } from 'child_process';

let buildHash = 'unknown';
try {
    buildHash = process.env.CF_PAGES_COMMIT_SHA || execSync('git rev-parse --short HEAD').toString().trim();
} catch { }

const nextConfig = {
    output: 'export',
    env: {
        BUILD_TIME: new Date().toISOString(),
        BUILD_HASH: buildHash,
        CF_PAGES: process.env.CF_PAGES || '',
        IS_DEV: process.env.NODE_ENV === 'development' ? 'true' : 'false'
    },
    experimental: {
        viewTransition: true
    }
};

export default nextConfig;
