'use client';

import { Title1, Title3, Text, Link, makeStyles, Button } from '@fluentui/react-components';
import { ArrowLeftRegular, BranchRegular } from '@fluentui/react-icons';
import { useRouter } from 'next/navigation';
import { useTopBar } from '@/components/TopBarProvider';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
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

export default function AboutPage() {
    const styles = useStyles();
    const router = useRouter();
    const { setShowBack } = useTopBar();

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

    const isCFPages = process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true';
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    const cfPagesUrl = process.env.CF_PAGES_URL || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let commitHistory: any[] = [];
    try {
        if (process.env.COMMIT_HISTORY) {
            commitHistory = JSON.parse(process.env.COMMIT_HISTORY);
        }
    } catch { }



    return (
        <div className={styles.container}>
            <div ref={backBtnRef}>
                <Button
                    appearance="subtle"
                    icon={<ArrowLeftRegular />}
                    onClick={() => router.back()}
                    className={`${styles.actionButton} ${styles.backButton}`}
                >
                    返回
                </Button>
            </div>

            <Title1>关于 ClassIsland 插件市场</Title1>

            <div className={styles.section}>
                <Text size={400}>
                    ClassIsland 插件市场是专为 ClassIsland 用户打造的官方插件分享与下载平台。在这里，你可以体验到丰富的功能扩展。
                </Text>
            </div>

            <div className={styles.section}>
                <Title3>当前版本</Title3>
                <Text>v{packageJson.version}</Text>
            </div>

            <div className={styles.section}>
                <Title3>开源与贡献</Title3>
                <Text>
                    本项目基于开源驱动，欢迎在 GitHub 上提交 Issue 或发起 Pull Request：
                </Text>
                <Link href="https://github.com/MINIOpenSource/classisland-marketplace" target="_blank">
                    ClassIsland Marketplace Frontend (GitHub)
                </Link>
            </div>

            <div className={styles.section}>
                <Title3>相关链接</Title3>
                <Link href="https://classisland.tech" target="_blank">ClassIsland 官方网站</Link>
                <Link href="https://docs.classisland.tech" target="_blank">ClassIsland 官方文档</Link>
                <Link href="https://github.com/MINIOpenSource/classisland-marketplace" target="_blank">ClassIsland Marketplace Frontend (GitHub)</Link>
            </div>

            {commitHistory.length > 0 && (
                <div className={styles.section} style={{ marginTop: '24px' }}>
                    <Title3>插件市场历史版本</Title3>
                    <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
                        展示最近的网络部署版本记录。
                    </Text>
                    {commitHistory.map((commit, idx) => {
                        return (
                            <div key={commit.hash} className={styles.timelineItem}>
                                <div className={styles.timelineLine}>
                                    <div className={styles.timelineDot} />
                                    {idx < commitHistory.length - 1 && (
                                        <div className={styles.timelineConnector} />
                                    )}
                                </div>
                                <div className={styles.versionContent}>
                                    <div className={styles.versionHeader}>
                                        <BranchRegular />
                                        <Text weight="semibold" style={{ fontFamily: 'ui-monospace, monospace' }}>{commit.shortHash}</Text>
                                        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                                            {commit.date}
                                        </Text>
                                        <Text size={200} style={{ color: 'var(--colorNeutralForeground4)' }}>
                                            {commit.author}
                                        </Text>
                                    </div>
                                    <Text size={300} style={{ display: 'block', marginTop: '4px' }}>{commit.message}</Text>
                                    <div className={styles.versionLinks}>
                                        <Link
                                            href={`https://github.com/MINIOpenSource/classisland-marketplace/commit/${commit.hash}`}
                                            target="_blank"
                                        >
                                            GitHub Commit记录
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
