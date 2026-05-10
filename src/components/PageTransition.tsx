'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="route-transition-framer"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
