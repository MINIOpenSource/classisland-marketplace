'use client';

import { Title1, Title3, Text, Link, makeStyles, Button, mergeClasses } from '@fluentui/react-components';
import { ArrowLeftRegular, BranchRegular } from '@fluentui/react-icons';
import { useRouter } from 'next/navigation';
import { useTopBar } from '@/components/TopBarProvider';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import packageJson from '../../../../package.json';

const useStyles = makeStyles({
    container: {
        padding: '32px 24px',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    actionButton: {
        borderRadius: '8px',
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        },
        ':active': {
            transform: 'translateY(0)',
        },
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    timelineItem: {
        display: 'flex',
        gap: '16px',
        position: 'relative',
        paddingBottom: '24px',
        '&:last-child': {
            paddingBottom: '0',
        },
        marginTop: '8px'
    },
    timelineLine: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '24px',
        flexShrink: 0,
    },
    timelineDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: 'var(--colorNeutralStroke1)',
        border: '2px solid var(--colorNeutralBackground1)',
        boxShadow: '0 0 0 2px var(--colorNeutralStroke2)',
        zIndex: 1,
        flexShrink: 0,
        marginTop: '6px',
    },
    timelineConnector: {
        width: '2px',
        flexGrow: 1,
        backgroundColor: 'var(--colorNeutralStroke2)',
        marginTop: '4px',
    },
    versionContent: {
        flex: 1,
        minWidth: 0,
        backgroundColor: 'var(--colorNeutralBackground2)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--colorNeutralStroke3)',
    },
    versionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
    },
    versionLinks: {
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
        flexWrap: 'wrap'
    }
});

interface GitHubCommit {
    sha: string;
    commit: {
        author: {
            name: string;
            date: string;
        };
        message: string;
    };
}

export default function AboutPage() {
    const styles = useStyles();
    const router = useRouter();
    const { setShowBack } = useTopBar();
    const t = useTranslations('Index');

    const [commits, setCommits] = useState<GitHubCommit[] | null>(null);
    const [commitsError, setCommitsError] = useState(false);

    const { ref: backBtnRef, inView: backBtnInView } = useInView({
        initialInView: true,
        threshold: 0,
    });

    useEffect(() => {
        setShowBack(!backBtnInView);
    }, [backBtnInView, setShowBack]);

    useEffect(() => {
        return () => setShowBack(false);
    }, [setShowBack]);

    useEffect(() => {
        let isMounted = true;
        fetch('https://api.github.com/repos/MINIOpenSource/classisland-marketplace/commits?per_page=10')
            .then(res => {
                if (!res.ok) throw new Error('API Error');
                return res.json();
            })
            .then(data => {
                if (isMounted) setCommits(data);
            })
            .catch(() => {
                if (isMounted) setCommitsError(true);
            });
        return () => { isMounted = false; };
    }, []);

    return (
        <div className={styles.container}>
            <div ref={backBtnRef}>
                <Button
                    appearance="subtle"
                    icon={<ArrowLeftRegular />}
                    onClick={() => router.back()}
                    className={mergeClasses(styles.actionButton, styles.backButton)}
                >
                    {t('back')}
                </Button>
            </div>

            <Title1>{t('aboutPageTitle')}</Title1>

            <div className={styles.section}>
                <Text size={400}>
                    {t('aboutPageDesc')}
                </Text>
            </div>

            <div className={styles.section}>
                <Title3>{t('currentVersionLabel')}</Title3>
                <Text>v{packageJson.version}</Text>
            </div>

            <div className={styles.section}>
                <Title3>{t('openSourceContrib')}</Title3>
                <Text>
                    {t('openSourceDesc')}
                </Text>
                <Link href="https://github.com/MINIOpenSource/classisland-marketplace" target="_blank">
                    {t('githubRepo')}
                </Link>
            </div>

            <div className={styles.section}>
                <Title3>{t('relatedLinks')}</Title3>
                <Link href="https://classisland.tech" target="_blank">{t('officialWebsite')}</Link>
                <Link href="https://docs.classisland.tech" target="_blank">{t('officialDocs')}</Link>
                <Link href="https://github.com/MINIOpenSource/classisland-marketplace" target="_blank">{t('githubRepo')}</Link>
            </div>

            <div className={styles.section} style={{ marginTop: '24px' }}>
                <Title3>{t('pluginMarketHistory')}</Title3>
                <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
                    {t('historyVersionDesc')}
                </Text>

                {commitsError ? (
                    <Text size={300} style={{ color: 'var(--colorPaletteRedForeground1)' }}>{t('loadCommitsError')}</Text>
                ) : commits === null ? (
                    <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>{t('loadingCommits')}</Text>
                ) : (
                    commits.map((commitData, idx) => {
                        return (
                            <div key={commitData.sha} className={styles.timelineItem}>
                                <div className={styles.timelineLine}>
                                    <div className={styles.timelineDot} />
                                    {idx < commits.length - 1 && (
                                        <div className={styles.timelineConnector} />
                                    )}
                                </div>
                                <div className={styles.versionContent}>
                                    <div className={styles.versionHeader}>
                                        <BranchRegular />
                                        <Text weight="semibold" style={{ fontFamily: 'ui-monospace, monospace' }}>{commitData.sha.substring(0, 7)}</Text>
                                        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                                            {new Date(commitData.commit.author.date).toLocaleString()}
                                        </Text>
                                        <Text size={200} style={{ color: 'var(--colorNeutralForeground4)' }}>
                                            {commitData.commit.author.name}
                                        </Text>
                                    </div>
                                    <Text size={300} style={{ display: 'block', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{commitData.commit.message}</Text>
                                    <div className={styles.versionLinks}>
                                        <Link
                                            href={`https://github.com/MINIOpenSource/classisland-marketplace/commit/${commitData.sha}`}
                                            target="_blank"
                                        >
                                            {t('githubCommitRecord')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
