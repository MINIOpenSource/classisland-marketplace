'use client';

import { useState } from 'react';
import { makeStyles, tokens, Button, Textarea, Text } from '@fluentui/react-components';
import { StarRegular, StarFilled } from '@fluentui/react-icons';
import Script from 'next/script';

const useStyles = makeStyles({
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow2,
    },
    stars: {
        display: 'flex',
        gap: '4px',
        cursor: 'pointer',
    },
    starIcon: {
        color: tokens.colorPaletteYellowForeground1,
        fontSize: '24px',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        alignItems: 'center'
    }
});

interface ReviewFormProps {
    pluginId: string;
    onSubmit: (score: number, content: string, token: string) => Promise<void>;
}

export function ReviewForm({ pluginId, onSubmit }: ReviewFormProps) {
    const styles = useStyles();
    const [score, setScore] = useState(0); // 1-10
    const [content, setContent] = useState('');
    const [hoverScore, setHoverScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Dummy key for testing

    const handleSubmit = async () => {
        if (score === 0) {
            setError('Please select a rating.');
            return;
        }
        if (content.length < 10) {
            setError('Review must be at least 10 characters long.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await new Promise<string>((resolve, reject) => {
                const widgetId = (window as any).turnstile?.render('#turnstile-container', {
                    sitekey: siteKey,
                    callback: (token: string) => resolve(token),
                    'error-callback': () => reject(new Error('Turnstile verification failed')),
                });

                setTimeout(() => {
                    reject(new Error('Turnstile verification timeout'));
                }, 30000);
            });

            await onSubmit(score, content, token);
            setScore(0);
            setContent('');
            (window as any).turnstile?.reset();
        } catch (e: any) {
            setError(e.message || 'An error occurred while submitting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.form}>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />

            <Text weight="semibold">Write a Review</Text>

            <div className={styles.stars} onMouseLeave={() => setHoverScore(0)}>
                {[1, 2, 3, 4, 5].map((s) => {
                    const val = s * 2;
                    const filled = hoverScore > 0 ? hoverScore >= val : score >= val;
                    return (
                        <div
                            key={s}
                            onMouseEnter={() => setHoverScore(val)}
                            onClick={() => setScore(val)}
                        >
                            {filled ? <StarFilled className={styles.starIcon} /> : <StarRegular className={styles.starIcon} />}
                        </div>
                    );
                })}
            </div>

            <Textarea
                placeholder="Share your experience with this plugin (min 10 characters)..."
                value={content}
                onChange={(e, data) => setContent(data.value)}
                disabled={isSubmitting}
                resize="vertical"
                style={{ minHeight: '100px' }}
            />

            <div id="turnstile-container" style={{ display: isSubmitting ? 'block' : 'none' }}></div>

            {error && <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{error}</Text>}

            <div className={styles.actions}>
                <Button appearance="primary" onClick={handleSubmit} disabled={isSubmitting || score === 0 || content.length < 10}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </div>
    );
}
