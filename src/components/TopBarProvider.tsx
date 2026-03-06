'use client';

import React, { createContext, useContext, useState } from 'react';

interface TopBarContextType {
    showBack: boolean;
    setShowBack: (val: boolean) => void;
}

const TopBarContext = createContext<TopBarContextType>({
    showBack: false,
    setShowBack: () => { },
});

export function TopBarProvider({ children }: { children: React.ReactNode }) {
    const [showBack, setShowBack] = useState(false);
    return <TopBarContext.Provider value={{ showBack, setShowBack }}>{children}</TopBarContext.Provider>;
}

export const useTopBar = () => useContext(TopBarContext);
