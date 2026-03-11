'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Button, makeStyles, tokens } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
const ENDPOINTS = [
    { id: 'vercel', url: 'https://vcipx.minisvc.com', name: 'Vercel' },
    { id: 'github', url: 'https://gcipx.minisvc.com', name: 'GitHub Pages' },
    { id: 'cloudflare', url: 'https://ccipx.minisvc.com', name: 'Cloudflare Pages' },
    { id: 'edgeone', url: 'https://ecipx.minisvc.com', name: 'EdgeOne Pages' },
    { id: 'official', url: 'https://cipx.minisvc.com', name: 'Official Manual Deployment' },
];

const useStyles = makeStyles({
    containerDesktop: {
        position: 'fixed',
        top: '80px',
        right: '24px',
        zIndex: 1000,
        width: '320px',
        animationName: {
            from: { opacity: 0, transform: 'translateX(20px)' },
            to: { opacity: 1, transform: 'translateX(0)' }
        },
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    containerMobile: {
        position: 'fixed',
        top: '64px',
        left: '16px',
        right: '16px',
        zIndex: 1000,
        animationName: {
            from: { opacity: 0, transform: 'translateY(-20px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
        },
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
        justifyContent: 'flex-end',
    },
    card: {
        boxShadow: tokens.shadow16,
    }
});

export function NodeSpeedTest() {
    const styles = useStyles();
    const [fastestNode, setFastestNode] = useState<{ id: string, name: string, url: string } | null>(null);
    const [currentLatency, setCurrentLatency] = useState(0);
    const [alternativeLatency, setAlternativeLatency] = useState(0);
    const [dismissed, setDismissed] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // For EdgeOne specifically
    const [showEdgeOnePrompt, setShowEdgeOnePrompt] = useState(false);
    const [edgeOneAlternativeNode, setEdgeOneAlternativeNode] = useState<{ id: string, name: string, url: string } | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        const savedDecision = localStorage.getItem('node_switch_dismissed');

        const runSpeedTest = async () => {
            const currentOrigin = window.location.origin;
            const isEdgeOne = process.env.NEXT_PUBLIC_IS_EDGEONE === 'true';

            let currentPing = Infinity;
            const results: { id: string, name: string, url: string, ping: number }[] = [];

            const ping = async (url: string) => {
                const start = Date.now();
                try {
                    // Fetch index or manifest to test latency
                    await fetch(`${url}/manifest.json?t=${start}`, { mode: 'no-cors', cache: 'no-store' });
                    return Date.now() - start;
                } catch {
                    return Infinity;
                }
            };

            await Promise.all(ENDPOINTS.map(async (ep) => {
                const p = await ping(ep.url);
                if (currentOrigin.includes(ep.url.replace('https://', '')) || (isEdgeOne && ep.id === 'edgeone')) {
                    currentPing = Math.min(p, currentPing); // It's possible we match but have real ping
                } else {
                    if (p < Infinity) {
                        results.push({ ...ep, ping: p });
                    }
                }
            }));

            // if we couldn't match origin (e.g. testing locally), just treat currentPing as local
            if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
                currentPing = 0;
            }

            results.sort((a, b) => a.ping - b.ping);

            if (results.length > 0) {
                const best = results[0];
                if (isEdgeOne && !localStorage.getItem('historical_download_node')) {
                    setEdgeOneAlternativeNode(best);
                    setShowEdgeOnePrompt(true);
                    setDismissed(false);
                }

                // If another node is significantly faster (e.g. 100ms)
                if (!savedDecision && !currentOrigin.includes('localhost') && (currentPing === Infinity || best.ping < currentPing - 100)) {
                    setFastestNode(best);
                    setCurrentLatency(currentPing);
                    setAlternativeLatency(best.ping);
                    setDismissed(false);
                }
            }
        };

        // Delay speedtest by 2s to not block initial render
        const t = setTimeout(() => {
            runSpeedTest();
        }, 2000);
        return () => clearTimeout(t);
    }, []);

    if (dismissed || (!fastestNode && !showEdgeOnePrompt)) return null;

    const handleSwitch = () => {
        if (fastestNode) {
            localStorage.setItem('node_switch_dismissed', '1');
            window.location.href = fastestNode.url + window.location.pathname + window.location.search;
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('node_switch_dismissed', '1');
        setDismissed(true);
    };

    const handleEdgeOneAccept = () => {
        if (edgeOneAlternativeNode) {
            localStorage.setItem('historical_download_node', edgeOneAlternativeNode.url);
        }
        setDismissed(true);
    };

    if (showEdgeOnePrompt && edgeOneAlternativeNode && !fastestNode) {
        return (
            <div className={isMobile ? styles.containerMobile : styles.containerDesktop}>
                <Card appearance="filled" className={styles.card}>
                    <div className={styles.header}>
                        <Text weight="bold">EdgeOne 历史版本下载</Text>
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setDismissed(true)} />
                    </div>
                    <Text size={200}>
                        当前节点不提供历史版本 cipx 下载。是否自动使用最近的 {edgeOneAlternativeNode.name} 节点下载？（无需跳转）
                    </Text>
                    <div className={styles.actions}>
                        <Button appearance="secondary" onClick={() => setDismissed(true)}>取消</Button>
                        <Button appearance="primary" onClick={handleEdgeOneAccept}>确定</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (fastestNode) {
        return (
            <div className={isMobile ? styles.containerMobile : styles.containerDesktop}>
                <Card appearance="filled" className={styles.card}>
                    <div className={styles.header}>
                        <Text weight="bold">发现更快的节点</Text>
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={handleDismiss} />
                    </div>
                    <Text size={200}>
                        检测到 {fastestNode.name} 节点延迟更低 ({alternativeLatency}ms，相比当前的 {currentLatency === Infinity ? '超时' : currentLatency + 'ms'})，是否切换？
                    </Text>
                    <div className={styles.actions}>
                        <Button appearance="secondary" onClick={handleDismiss}>暂不切换</Button>
                        <Button appearance="primary" onClick={handleSwitch}>立即切换</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
}
