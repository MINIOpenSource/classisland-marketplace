'use client';

import React, { createContext, useContext, useState } from 'react';

export interface PluginTopBarInfo {
    name: string;
    iconSrc?: string;
    actions?: React.ReactNode;
}

interface TopBarContextType {
    showBack: boolean;
    setShowBack: (val: boolean) => void;
    pluginInfo: PluginTopBarInfo | null;
    setPluginInfo: (val: PluginTopBarInfo | null) => void;
}

const TopBarContext = createContext<TopBarContextType>({
    showBack: false,
    setShowBack: () => { },
    pluginInfo: null,
    setPluginInfo: () => { },
});

export function TopBarProvider({ children }: { children: React.ReactNode }) {
    const [showBack, setShowBack] = useState(false);
    const [pluginInfo, setPluginInfo] = useState<PluginTopBarInfo | null>(null);
    return <TopBarContext.Provider value={{ showBack, setShowBack, pluginInfo, setPluginInfo }}>{children}</TopBarContext.Provider>;
}

export const useTopBar = () => useContext(TopBarContext);
