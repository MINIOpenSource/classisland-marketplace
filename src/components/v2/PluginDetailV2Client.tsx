
'use client';

import { useState } from 'react';
import { PluginData } from '@/components/PluginCard';
import { ReviewResponse, submitReview } from '@/services/interactiveAPI';
import { VersionHistory } from '@/components/VersionHistory';
import { RatingSummary } from './RatingSummary';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';

interface Props {
    plugin: PluginData;
    readmeNode: React.ReactNode;
    versionHistory: any;
    reviewsData: ReviewResponse | null;
    isCFPages: boolean;
}

export function PluginDetailV2Client({ plugin, readmeNode, versionHistory, reviewsData, isCFPages }: Props) {
    const [activeTab, setActiveTab] = useState('readme');
    const [reviews, setReviews] = useState(reviewsData?.reviews || []);
    const [stats, setStats] = useState(reviewsData?.stats || {});

    const handleReviewSubmit = async (score: number, content: string, token: string) => {
        await submitReview(plugin.Manifest.Id, score, content, token);
        alert('Review submitted successfully!');
        window.location.reload();
    };

    // Non-Fluent UI styling
    return (
        <div style={{
            fontFamily: 'system-ui, sans-serif',
            background: '#fafafa',
            minHeight: '100vh',
            color: '#111'
        }}>
            {/* Header Hero */}
            <div style={{
                background: '#111',
                color: 'white',
                padding: '4rem 2rem 6rem',
                borderBottomLeftRadius: '40px',
                borderBottomRightRadius: '40px',
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                    <img src={plugin.CachedIconFile || '/favicon.ico'} style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'white', padding: '10px' }} />
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', fontWeight: '900', letterSpacing: '-1px' }}>{plugin.Manifest.Name}</h1>
                        <p style={{ fontSize: '1.2rem', color: '#aaa', margin: '0 0 1rem 0' }}>{plugin.Manifest.Description}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#ccc', fontSize: '0.9rem' }}>
                            <span>By <b>{plugin.Manifest.Author}</b></span>
                            <span>v{plugin.Manifest.Version}</span>
                            <span>⭐ {plugin.StarsCount}</span>
                            <span>⬇️ {plugin.DownloadCount}</span>
                        </div>
                    </div>
                    <div>
                        <button style={{
                            background: 'white',
                            color: 'black',
                            padding: '1rem 2.5rem',
                            borderRadius: '50px',
                            border: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 8px 15px rgba(255,255,255,0.2)'
                        }}>Download</button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ maxWidth: '1000px', margin: '-3rem auto 2rem', background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                {/* Custom Tabs */}
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #eee', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('readme')}
                        style={{ background: 'none', border: 'none', padding: '1rem 0', fontSize: '1.1rem', fontWeight: activeTab === 'readme' ? 'bold' : 'normal', color: activeTab === 'readme' ? '#111' : '#888', borderBottom: activeTab === 'readme' ? '3px solid #111' : '3px solid transparent', cursor: 'pointer' }}
                    >Overview</button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        style={{ background: 'none', border: 'none', padding: '1rem 0', fontSize: '1.1rem', fontWeight: activeTab === 'reviews' ? 'bold' : 'normal', color: activeTab === 'reviews' ? '#111' : '#888', borderBottom: activeTab === 'reviews' ? '3px solid #111' : '3px solid transparent', cursor: 'pointer' }}
                    >Reviews & Ratings</button>
                </div>

                {activeTab === 'readme' && (
                    <div style={{ lineHeight: '1.6', fontSize: '1.05rem' }}>
                        {readmeNode}
                        <div style={{ marginTop: '4rem' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Version History</h3>
                            <VersionHistory versions={versionHistory} currentVersion={plugin.Manifest.Version} />
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', '@media (minWidth: 768px)': { gridTemplateColumns: '2fr 1fr' } } as any}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Community Voices</h3>

                            {isCFPages ? (
                                <ReviewForm pluginId={plugin.Manifest.Id} onSubmit={handleReviewSubmit} />
                            ) : (
                                <div style={{ padding: '16px', background: '#fff3cd', color: '#856404', borderRadius: '8px' }}>
                                    Review submission is only available on the official Cloudflare Pages deployment.
                                </div>
                            )}

                            <ReviewList reviews={reviews} isCFPages={isCFPages} />
                        </div>
                        <div>
                            <RatingSummary stats={stats as any} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
