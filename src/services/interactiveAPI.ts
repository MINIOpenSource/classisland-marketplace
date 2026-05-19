export interface Review {
    uuid: string;
    plugin_id: string;
    score: number;
    content: string;
    ip?: string;
    created_at?: string;
    upvotes?: number;
    downvotes?: number;
}

export interface ReviewResponse {
    stats: {
        1: number; 2: number; 3: number; 4: number; 5: number;
        6: number; 7: number; 8: number; 9: number; 10: number;
    };
    reviews: Review[];
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface AdminReviewResponse {
    data: Review[];
    pagination: Pagination;
}

export interface Vote {
    review_uuid: string;
    ip: string;
    vote_type: 'up' | 'down';
    created_at: string;
}

export interface AdminVoteResponse {
    data: Vote[];
    pagination: Pagination;
}

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_WORKER_API_URL || 'https://classisland-marketplace-interactive-worker.miniopensource.workers.dev');

// --- Public APIs ---

export async function submitReview(pluginId: string, score: number, content: string, turnstileToken: string) {
    const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin_id: pluginId, score, content, turnstileToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit review');
    return data;
}

export async function fetchRatings(pluginIds: string[]) {
    if (pluginIds.length === 0) return {};
    const idsParam = pluginIds.join(',');
    const res = await fetch(`${API_BASE}/api/ratings?plugins=${idsParam}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch ratings');
    return data.data;
}

export async function fetchReviews(pluginId: string, limit: number = 20): Promise<ReviewResponse> {
    const res = await fetch(`${API_BASE}/api/plugins/${pluginId}/reviews?limit=${limit}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews');
    return data;
}

export async function voteReview(uuid: string, action: 'up' | 'down', turnstileToken: string) {
    const res = await fetch(`${API_BASE}/api/reviews/${uuid}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, turnstileToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit vote');
    return data;
}

// --- Admin APIs ---

export async function adminFetchReviews(token: string, page = 1, limit = 20, pluginId?: string, ip?: string): Promise<AdminReviewResponse> {
    const url = new URL(`${API_BASE}/api/admin/reviews`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (pluginId) url.searchParams.append('plugin_id', pluginId);
    if (ip) url.searchParams.append('ip', ip);

    const res = await fetch(url.toString(), {
        headers: token ? { 'CF-Access-JWT-Assertion': token } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin reviews');
    return data;
}

export async function adminDeleteReview(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/api/admin/reviews/${uuid}`, {
        method: 'DELETE',
        headers: token ? { 'CF-Access-JWT-Assertion': token } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete review');
    return data;
}

export async function adminFetchVotes(uuid: string, token: string, page = 1, limit = 20): Promise<AdminVoteResponse> {
    const url = new URL(`${API_BASE}/api/admin/reviews/${uuid}/votes`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());

    const res = await fetch(url.toString(), {
        headers: token ? { 'CF-Access-JWT-Assertion': token } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin votes');
    return data;
}

export async function adminDeleteVote(reviewUuid: string, ip: string, token: string) {
    const res = await fetch(`${API_BASE}/api/admin/votes/${reviewUuid}/${ip}`, {
        method: 'DELETE',
        headers: token ? { 'CF-Access-JWT-Assertion': token } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete vote');
    return data;
}
