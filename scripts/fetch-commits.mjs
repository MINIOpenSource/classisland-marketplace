import fs from 'fs';
import path from 'path';

async function fetchCommits() {
    const outputDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
        const res = await fetch('https://api.github.com/repos/MINIOpenSource/classisland-marketplace/commits?per_page=10');
        if (!res.ok) {
            throw new Error('API Error fetching commits');
        }
        const data = await res.json();
        fs.writeFileSync(path.join(outputDir, 'commits.json'), JSON.stringify(data, null, 2), 'utf-8');
        console.log('ClassIsland Marketplace: Fetched latest 10 commits successfully.');
    } catch (err) {
        console.error('Failed to fetch commits during build:', err);
        // Fallback to empty
        fs.writeFileSync(path.join(outputDir, 'commits.json'), '[]', 'utf-8');
    }
}

fetchCommits();
