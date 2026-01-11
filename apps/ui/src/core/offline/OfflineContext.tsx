import { createContext, useContext, useState, useEffect } from 'react';

interface OfflineContextValue {
    isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: React.PropsWithChildren) {
    const [isOffline, setIsOffline] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !navigator.onLine;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateOfflineStatus = () => {
            setIsOffline(!navigator.onLine);
        };

        window.addEventListener('online', updateOfflineStatus);
        window.addEventListener('offline', updateOfflineStatus);

        return () => {
            window.removeEventListener('online', updateOfflineStatus);
            window.removeEventListener('offline', updateOfflineStatus);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline }}>
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline(): OfflineContextValue {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
