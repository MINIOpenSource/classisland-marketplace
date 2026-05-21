'use client';

import { makeStyles, Text, tokens, ProgressBar } from '@fluentui/react-components';
import { StarRegular, StarFilled } from '@fluentui/react-icons';

const useStyles = makeStyles({
    container: {
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
        alignItems: 'center',
        gap: '12px',
    },
    scoreBox: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
    },
    distribution: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    starLabel: {
        width: '40px',
        textAlign: 'right',
    },
    barWrapper: {
        flexGrow: 1,
    },
});

interface RatingSummaryProps {
    stats: Record<string, number>;
}

export function RatingSummary({ stats }: RatingSummaryProps) {
    const styles = useStyles();

    let totalVotes = 0;
    let totalScore = 0;
    for (let i = 1; i <= 10; i++) {
        const count = stats[i.toString()] || 0;
        totalVotes += count;
        totalScore += count * i;
    }

    const averageScore = totalVotes > 0 ? (totalScore / totalVotes).toFixed(1) : '0.0';
    const average5Star = totalVotes > 0 ? (totalScore / totalVotes / 2).toFixed(1) : '0.0';

    // Map 1-10 to 1-5 stars for display
    const starDist = {
        5: (stats['9'] || 0) + (stats['10'] || 0),
        4: (stats['7'] || 0) + (stats['8'] || 0),
        3: (stats['5'] || 0) + (stats['6'] || 0),
        2: (stats['3'] || 0) + (stats['4'] || 0),
        1: (stats['1'] || 0) + (stats['2'] || 0),
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.scoreBox}>
                    <Text size={800} weight="bold">{average5Star}</Text>
                    <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>/ 5</Text>
                </div>
                <div style={{ display: 'flex', gap: '2px', color: tokens.colorPaletteYellowForeground1 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        s <= Math.round(parseFloat(average5Star)) ? <StarFilled key={s} /> : <StarRegular key={s} />
                    ))}
                </div>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>({totalVotes} votes)</Text>
            </div>

            <div className={styles.distribution}>
                {[5, 4, 3, 2, 1].map((star) => {
                    const count = starDist[star as keyof typeof starDist];
                    const percent = totalVotes > 0 ? (count / totalVotes) : 0;
                    return (
                        <div key={star} className={styles.row}>
                            <Text size={200} className={styles.starLabel}>{star} <StarFilled fontSize={12} style={{ color: tokens.colorPaletteYellowForeground1 }} /></Text>
                            <div className={styles.barWrapper}>
                                <ProgressBar value={percent} thickness="medium" color={percent > 0 ? "success" : "error"} />
                            </div>
                            <Text size={200} style={{ width: '30px', color: tokens.colorNeutralForeground3 }}>{count}</Text>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
