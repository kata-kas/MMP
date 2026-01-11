import { createContext, useContext, useRef, useCallback, useEffect, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
    title: string;
    description: string;
    duration: number;
}

interface CacheEntry {
    timestamp: number;
}

interface ToastContextValue {
    showErrorToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Maximum number of cached toast entries before LRU eviction
const MAX_CACHE_SIZE = 100;
// Time window (ms) for deduplication - same toast won't show twice within this window
const TOAST_DEDUP_WINDOW = 2000;
// Maximum number of toasts allowed per deduplication window
const MAX_TOASTS_PER_WINDOW = 5;
// Maximum number of toasts in queue at once to prevent UI overflow
const MAX_QUEUE_DEPTH = 20;
// Interval (ms) for cache cleanup to remove stale entries
const CLEANUP_INTERVAL = 5000;

export function ToastProvider({ children }: React.PropsWithChildren) {
    const toastCacheRef = useRef(new Map<string, CacheEntry>());
    const toastCountRef = useRef(0);
    const lastResetTimeRef = useRef(Date.now());
    const queueDepthRef = useRef(0);
    const cleanupIntervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cleanupCache = useCallback(() => {
        const now = Date.now();
        const cache = toastCacheRef.current;
        
        if (now - lastResetTimeRef.current > TOAST_DEDUP_WINDOW) {
            toastCountRef.current = 0;
            lastResetTimeRef.current = now;
        }

        if (cache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
            toDelete.forEach(([key]) => cache.delete(key));
        } else {
            const cutoff = now - TOAST_DEDUP_WINDOW;
            for (const [key, entry] of cache.entries()) {
                if (entry.timestamp < cutoff) {
                    cache.delete(key);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (cleanupIntervalIdRef.current === null) {
            cleanupIntervalIdRef.current = setInterval(cleanupCache, CLEANUP_INTERVAL);
        }

        return () => {
            if (cleanupIntervalIdRef.current !== null) {
                clearInterval(cleanupIntervalIdRef.current);
                cleanupIntervalIdRef.current = null;
            }
        };
    }, [cleanupCache]);

    const getCacheKey = useCallback((title: string, description: string): string => {
        return `${title}:${description}`;
    }, []);

    const showErrorToast = useCallback((options: ToastOptions) => {
        const now = Date.now();
        
        if (now - lastResetTimeRef.current > TOAST_DEDUP_WINDOW) {
            toastCountRef.current = 0;
            lastResetTimeRef.current = now;
        }

        if (queueDepthRef.current >= MAX_QUEUE_DEPTH) {
            return;
        }

        if (toastCountRef.current >= MAX_TOASTS_PER_WINDOW) {
            return;
        }

        const cacheKey = getCacheKey(options.title, options.description);
        const entry = toastCacheRef.current.get(cacheKey);

        if (entry !== undefined && now - entry.timestamp < TOAST_DEDUP_WINDOW) {
            return;
        }

        toastCacheRef.current.set(cacheKey, { timestamp: now });
        toastCountRef.current++;
        queueDepthRef.current++;

        sonnerToast.error(options.title, {
            description: options.description,
            duration: options.duration,
            onDismiss: () => {
                queueDepthRef.current = Math.max(0, queueDepthRef.current - 1);
            },
        });
    }, [getCacheKey]);

    const contextValue = useMemo(() => ({
        showErrorToast,
    }), [showErrorToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
