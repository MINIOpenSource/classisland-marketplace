'use client';

import { useEffect, useState } from 'react';
import { Spinner, makeStyles, tokens, mergeClasses } from '@fluentui/react-components';

const useStyles = makeStyles({
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: tokens.colorNeutralBackground1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s',
        opacity: 1,
        visibility: 'visible',
    },
    hidden: {
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
    },
});

export function LoadingOverlay() {
    const styles = useStyles();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Since this runs after React hydration is complete and the component is mounted,
        // it means the essential JS/CSS has loaded and the page is interactive.
        // We use a small timeout to ensure the browser has painted the initial layout.
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // We render it directly on the client side during SSR it will also output this HTML
    // covering the screen until React hydrates and the useEffect triggers.
    return (
        <div className={mergeClasses(styles.overlay, !isLoading && styles.hidden)}>
            <Spinner size="large" appearance="primary" label="Loading..." />
        </div>
    );
}
