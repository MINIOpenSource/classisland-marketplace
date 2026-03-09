import fs from 'fs';
import path from 'path';

async function fetchCommits() {
    const outputDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        let allCommits = [];
        let page = 1;
        while (true) {
            const res = await fetch(`https://api.github.com/repos/MINIOpenSource/classisland-marketplace/commits?per_page=100&page=${page}`);
            if (!res.ok) {
                // Ignore API limits if we already have some commits
                if (allCommits.length > 0) break;
                throw new Error('API Error fetching commits');
            }
            const data = await res.json();
            if (data.length === 0) break;
            allCommits = allCommits.concat(data);
            page++;
        }

        fs.writeFileSync(path.join(outputDir, 'commits.json'), JSON.stringify(allCommits, null, 2), 'utf-8');
        console.log(`ClassIsland Marketplace: Fetched ${allCommits.length} commits successfully.`);
    } catch (err) {
        console.error('Failed to fetch commits during build:', err);
        // Fallback to empty
        fs.writeFileSync(path.join(outputDir, 'commits.json'), '[]', 'utf-8');
    }
}

fetchCommits();
