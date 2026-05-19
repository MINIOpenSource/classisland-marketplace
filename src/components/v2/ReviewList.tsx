'use client';

import { useState } from 'react';
import { makeStyles, tokens, Text, Button, Avatar, Divider, Spinner } from '@fluentui/react-components';
import { StarFilled, ThumbLikeRegular, ThumbDislikeRegular, ThumbLikeFilled, ThumbDislikeFilled } from '@fluentui/react-icons';
import { Review, voteReview } from '@/services/interactiveAPI';

const useStyles = makeStyles({
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    reviewCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow2,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    stars: {
        display: 'flex',
        gap: '2px',
        color: tokens.colorPaletteYellowForeground1,
    },
    content: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-start',
        gap: '16px',
        alignItems: 'center',
    },
    voteButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        color: tokens.colorNeutralForeground3,
        ':hover': {
            color: tokens.colorNeutralForeground1,
        }
    }
});

interface ReviewListProps {
    reviews: Review[];
    isCFPages: boolean;
}

export function ReviewList({ reviews, isCFPages }: ReviewListProps) {
    const styles = useStyles();
    const [voted, setVoted] = useState<Record<string, 'up' | 'down'>>({});
    const [voting, setVoting] = useState<Record<string, boolean>>({});
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    const handleVote = async (uuid: string, action: 'up' | 'down') => {
        if (!isCFPages) return;
        if (voting[uuid]) return;
        setVoting(prev => ({ ...prev, [uuid]: true }));

        try {
            const token = await new Promise<string>((resolve, reject) => {
                const widgetId = (window as any).turnstile?.render('#invisible-turnstile', {
                    sitekey: siteKey,
                    callback: (token: string) => resolve(token),
                    'error-callback': () => reject(new Error('Turnstile failed')),
                });
                setTimeout(() => reject(new Error('Timeout')), 30000);
            });

            await voteReview(uuid, action, token);
            setVoted(prev => ({ ...prev, [uuid]: action }));
            (window as any).turnstile?.reset();

        } catch (e) {
            console.error(e);
        } finally {
            setVoting(prev => ({ ...prev, [uuid]: false }));
        }
    };

    if (!reviews || reviews.length === 0) {
        return <Text style={{ color: tokens.colorNeutralForeground3 }}>No reviews yet. Be the first to share your thoughts!</Text>;
    }

    return (
        <div className={styles.list}>
            <div id="invisible-turnstile" style={{ display: 'none' }}></div>
            {reviews.map(review => {
                const displayStars = Math.round(review.score / 2);
                const hasVotedUp = voted[review.uuid] === 'up';
                const hasVotedDown = voted[review.uuid] === 'down';
                const upvotes = (review.upvotes || 0) + (hasVotedUp ? 1 : 0);
                const downvotes = (review.downvotes || 0) + (hasVotedDown ? 1 : 0);

                return (
                    <div key={review.uuid} className={styles.reviewCard}>
                        <div className={styles.header}>
                            <div className={styles.userInfo}>
                                <Avatar name="Anonymous User" size={24} />
                                <Text weight="semibold">Anonymous</Text>
                            </div>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                                {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                            </Text>
                        </div>
                        <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map(s => (
                                s <= displayStars ? <StarFilled key={s} fontSize={16} /> : <StarFilled key={s} fontSize={16} style={{ color: tokens.colorNeutralForeground4 }} />
                            ))}
                        </div>
                        <Text className={styles.content}>{review.content}</Text>
                        {isCFPages && (
                            <>
                                <Divider />
                                <div className={styles.footer}>
                                    <div
                                        className={styles.voteButton}
                                        onClick={() => handleVote(review.uuid, 'up')}
                                        style={{ color: hasVotedUp ? tokens.colorBrandForeground1 : undefined }}
                                    >
                                        {voting[review.uuid] ? <Spinner size="extra-tiny" /> : (hasVotedUp ? <ThumbLikeFilled /> : <ThumbLikeRegular />)}
                                        <Text size={200}>{upvotes}</Text>
                                    </div>
                                    <div
                                        className={styles.voteButton}
                                        onClick={() => handleVote(review.uuid, 'down')}
                                        style={{ color: hasVotedDown ? tokens.colorPaletteRedForeground1 : undefined }}
                                    >
                                        {voting[review.uuid] ? <Spinner size="extra-tiny" /> : (hasVotedDown ? <ThumbDislikeFilled /> : <ThumbDislikeRegular />)}
                                        <Text size={200}>{downvotes}</Text>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
