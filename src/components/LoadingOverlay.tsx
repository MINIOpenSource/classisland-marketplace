'use client';

import { useEffect, useState } from 'react';
import { Spinner, makeStyles, mergeClasses } from '@fluentui/react-components';

const useStyles = makeStyles({
    overlay: {
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
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
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // We render it directly on the client side during SSR it will also output this HTML
    // covering the screen until React hydrates and the useEffect triggers.
    // We inject a tiny inline style to dynamically read the exact background color from
    // the system preference or `.dark` class (if hydration happened but the class was toggled)
    // so it perfectly matches Fluent UI's tokens.
    return (
        <div
            className={mergeClasses(styles.overlay, !isLoading && styles.hidden)}
            style={{ backgroundColor: 'var(--loading-overlay-bg, #ffffff)' }}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                :root { --loading-overlay-bg: #ffffff; }
                :root.dark { --loading-overlay-bg: #292929; }
                @media (prefers-color-scheme: dark) {
                    :root:not(.light) { --loading-overlay-bg: #292929; }
                }
            ` }} />
            <Spinner size="large" appearance="primary" label="Loading..." />
        </div>
    );
}
