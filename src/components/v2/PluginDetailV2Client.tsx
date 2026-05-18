'use client';

import { useState } from 'react';
import { makeStyles, tokens, Text, Button, TabList, Tab, Avatar, Dialog, DialogSurface, DialogBody, DialogContent } from '@fluentui/react-components';
import { ArrowLeftRegular, ArrowDownloadRegular, ShareRegular } from '@fluentui/react-icons';
import { useRouter } from 'next/navigation';
import { PluginData } from '@/components/PluginCard';
import { RatingSummary } from './RatingSummary';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { submitReview, ReviewResponse } from '@/services/interactiveAPI';

const useStyles = makeStyles({
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    header: {
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '32px',
        borderRadius: tokens.borderRadiusLarge,
        boxShadow: tokens.shadow4,
    },
    icon: {
        width: '96px',
        height: '96px',
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow2,
    },
    info: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    actions: {
        display: 'flex',
        gap: '12px',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
    },
    mainColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '24px',
        borderRadius: tokens.borderRadiusLarge,
        boxShadow: tokens.shadow2,
    },
    sideColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    }
});

interface Props {
    plugin: PluginData;
    readmeNode: React.ReactNode;
    versionHistory: any;
    reviewsData: ReviewResponse | null;
}

export function PluginDetailV2Client({ plugin, readmeNode, versionHistory, reviewsData }: Props) {
    const styles = useStyles();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<'readme' | 'reviews'>('readme');

    // Fallback logic for client side if needed
    const isCFPages = process.env.NEXT_PUBLIC_CF_PAGES === 'true' || process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true';

    const [reviews, setReviews] = useState(reviewsData?.reviews || []);
    const [stats, setStats] = useState(reviewsData?.stats || {});

    const handleReviewSubmit = async (score: number, content: string, token: string) => {
        await submitReview(plugin.Manifest.Id, score, content, token);
        alert('Review submitted successfully!');
        window.location.reload(); // naive reload to fetch new stats
    };

    return (
        <div className={styles.container}>
            <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={() => router.back()} style={{ alignSelf: 'flex-start' }}>Back</Button>

            <div className={styles.header}>
                <img src={plugin.CachedIconFile || '/favicon.ico'} alt="Plugin Icon" className={styles.icon} />
                <div className={styles.info}>
                    <Text size={900} weight="bold">{plugin.Manifest.Name}</Text>
                    <Text size={400} style={{ color: tokens.colorNeutralForeground3 }}>{plugin.Manifest.Description}</Text>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Avatar name={plugin.Manifest.Author} size={24} />
                            <Text weight="semibold">{plugin.Manifest.Author}</Text>
                        </div>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>Version {plugin.Manifest.Version}</Text>
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button appearance="primary" size="large" icon={<ArrowDownloadRegular />}>Download</Button>
                    <Button appearance="secondary" size="large" icon={<ShareRegular />}>Share</Button>
                </div>
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainColumn}>
                    <TabList selectedValue={selectedTab} onTabSelect={(e, d) => setSelectedTab(d.value as any)}>
                        <Tab value="readme">Details</Tab>
                        <Tab value="reviews">Reviews & Ratings</Tab>
                    </TabList>

                    {selectedTab === 'readme' && (
                        <div>{readmeNode}</div>
                    )}

                    {selectedTab === 'reviews' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                            <Text size={600} weight="semibold">User Reviews</Text>
                            {isCFPages ? (
                                <ReviewForm pluginId={plugin.Manifest.Id} onSubmit={handleReviewSubmit} />
                            ) : (
                                <div style={{ padding: '16px', backgroundColor: tokens.colorPaletteYellowBackground1, borderRadius: tokens.borderRadiusMedium }}>
                                    <Text style={{ color: tokens.colorPaletteYellowForeground1 }}>Review submission is only available on the official Cloudflare Pages deployment.</Text>
                                </div>
                            )}
                            <ReviewList reviews={reviews} isCFPages={isCFPages} />
                        </div>
                    )}
                </div>

                <div className={styles.sideColumn}>
                    <RatingSummary stats={stats as any} />

                    <div style={{ backgroundColor: tokens.colorNeutralBackground1, padding: '16px', borderRadius: tokens.borderRadiusMedium, boxShadow: tokens.shadow2 }}>
                        <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>Information</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ color: tokens.colorNeutralForeground3 }}>Downloads</Text>
                                <Text weight="semibold">{plugin.DownloadCount}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ color: tokens.colorNeutralForeground3 }}>Stars</Text>
                                <Text weight="semibold">{plugin.StarsCount}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ color: tokens.colorNeutralForeground3 }}>Identifier</Text>
                                <Text size={200} style={{ wordBreak: 'break-all', textAlign: 'right', maxWidth: '150px' }}>{plugin.Manifest.Id}</Text>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
