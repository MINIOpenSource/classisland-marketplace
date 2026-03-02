'use client';

import { makeStyles } from '@fluentui/react-components';
import { Children, ReactNode } from 'react';

const useStyles = makeStyles({
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '24px',
        padding: '24px 0',
        width: '100%',
        '@media (max-width: 1400px)': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        },
        '@media (max-width: 1000px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        '@media (max-width: 700px)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
        }
    },
});

export function PluginGrid({ children }: { children: ReactNode }) {
    const styles = useStyles();

    return (
        <div className={styles.grid}>
            {Children.map(children, (child) => child)}
        </div>
    );
}
