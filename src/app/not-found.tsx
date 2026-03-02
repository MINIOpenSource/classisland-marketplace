'use client';

import { useLocale } from '@/components/LanguageProvider';
import { Card, CardHeader, makeStyles, Text, Title1, tokens } from '@fluentui/react-components';
import { DismissCircleRegular } from '@fluentui/react-icons';
import en_US from '@/messages/en_US.json';
import zh_CN from '@/messages/zh_CN.json';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const useStyles = makeStyles({
    page: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    main: {
        padding: '24px',
        flexGrow: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: 'min(640px, 100%)',
        borderRadius: tokens.borderRadiusXLarge,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        boxShadow: tokens.shadow8,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '24px',
    },
});

export default function GlobalNotFoundPage() {
    const styles = useStyles();
    const router = useRouter();
    const { locale } = useLocale();
    const [seconds, setSeconds] = useState(5);
    const m = locale === 'zh_CN' ? zh_CN.NotFound : en_US.NotFound;

    useEffect(() => {
        const timer = window.setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    router.replace('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [router]);

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <Card className={styles.card}>
                    <CardHeader
                        image={<DismissCircleRegular fontSize={28} />}
                        header={<Title1>{m.code}</Title1>}
                        description={<Text>{m.globalTitle}</Text>}
                    />
                    <div className={styles.content}>
                        <Text>{m.globalDesc}</Text>
                        <Text>{m.redirecting.replace('{seconds}', String(seconds))}</Text>
                    </div>
                </Card>
            </main>
        </div>
    );
}
