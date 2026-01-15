import React, { createContext, useContext, useState, useEffect } from "react";

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbContextType {
    items: BreadcrumbItem[] | null;
    setBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
    undefined,
);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<BreadcrumbItem[] | null>(null);

    return (
        <BreadcrumbContext.Provider value={{ items, setBreadcrumbs: setItems }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbs() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
    }
    return context;
}

export function useSetBreadcrumbs(items: BreadcrumbItem[] | null) {
    const { setBreadcrumbs } = useBreadcrumbs();
    useEffect(() => {
        setBreadcrumbs(items);
        return () => setBreadcrumbs(null);
    }, [JSON.stringify(items), setBreadcrumbs]);
}
