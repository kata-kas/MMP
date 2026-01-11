import { describe, it, expect, beforeEach } from 'vitest';

interface CacheEntry {
    timestamp: number;
}

interface ToastOptions {
    title: string;
    description: string;
    duration: number;
}

const TOAST_DEDUP_WINDOW = 2000;
const MAX_TOASTS_PER_WINDOW = 5;
const MAX_QUEUE_DEPTH = 20;

function getCacheKey(title: string, description: string): string {
    return `${title}:${description}`;
}

function shouldShowToast(
    cache: Map<string, CacheEntry>,
    toastCount: number,
    queueDepth: number,
    now: number,
    lastResetTime: number,
    options: ToastOptions
): boolean {
    if (queueDepth >= MAX_QUEUE_DEPTH) {
        return false;
    }

    if (toastCount >= MAX_TOASTS_PER_WINDOW) {
        return false;
    }

    const cacheKey = getCacheKey(options.title, options.description);
    const entry = cache.get(cacheKey);

    if (entry !== undefined && now - entry.timestamp < TOAST_DEDUP_WINDOW) {
        return false;
    }

    return true;
}

describe('toast deduplication logic', () => {
    let cache: Map<string, CacheEntry>;
    let now: number;

    beforeEach(() => {
        cache = new Map();
        now = Date.now();
    });

    describe('deduplication window', () => {
        it('should allow toast if not in cache', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, 0, 0, now, now, options);

            expect(result).toBe(true);
        });

        it('should block toast if same toast shown within deduplication window', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const cacheKey = getCacheKey(options.title, options.description);
            cache.set(cacheKey, { timestamp: now - 1000 });

            const result = shouldShowToast(cache, 0, 0, now, now, options);

            expect(result).toBe(false);
        });

        it('should allow toast if same toast shown outside deduplication window', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const cacheKey = getCacheKey(options.title, options.description);
            cache.set(cacheKey, { timestamp: now - TOAST_DEDUP_WINDOW - 100 });

            const result = shouldShowToast(cache, 0, 0, now, now, options);

            expect(result).toBe(true);
        });

        it('should differentiate toasts by title and description', () => {
            const options1: ToastOptions = {
                title: 'Error',
                description: 'First error',
                duration: 5000,
            };

            const options2: ToastOptions = {
                title: 'Error',
                description: 'Second error',
                duration: 5000,
            };

            const cacheKey1 = getCacheKey(options1.title, options1.description);
            cache.set(cacheKey1, { timestamp: now - 1000 });

            const result1 = shouldShowToast(cache, 0, 0, now, now, options1);
            const result2 = shouldShowToast(cache, 0, 0, now, now, options2);

            expect(result1).toBe(false);
            expect(result2).toBe(true);
        });
    });

    describe('toast count limit', () => {
        it('should allow toast when count is below limit', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, MAX_TOASTS_PER_WINDOW - 1, 0, now, now, options);

            expect(result).toBe(true);
        });

        it('should block toast when count reaches limit', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, MAX_TOASTS_PER_WINDOW, 0, now, now, options);

            expect(result).toBe(false);
        });

        it('should block toast when count exceeds limit', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, MAX_TOASTS_PER_WINDOW + 1, 0, now, now, options);

            expect(result).toBe(false);
        });
    });

    describe('queue depth limit', () => {
        it('should allow toast when queue depth is below limit', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, 0, MAX_QUEUE_DEPTH - 1, now, now, options);

            expect(result).toBe(true);
        });

        it('should block toast when queue depth reaches limit', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, 0, MAX_QUEUE_DEPTH, now, now, options);

            expect(result).toBe(false);
        });

        it('should block toast when queue depth exceeds limit', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(cache, 0, MAX_QUEUE_DEPTH + 1, now, now, options);

            expect(result).toBe(false);
        });
    });

    describe('combined limits', () => {
        it('should block if both count and queue limits reached', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const result = shouldShowToast(
                cache,
                MAX_TOASTS_PER_WINDOW,
                MAX_QUEUE_DEPTH,
                now,
                now,
                options
            );

            expect(result).toBe(false);
        });

        it('should allow if deduplication blocks but limits not reached', () => {
            const options: ToastOptions = {
                title: 'Error',
                description: 'Something went wrong',
                duration: 5000,
            };

            const cacheKey = getCacheKey(options.title, options.description);
            cache.set(cacheKey, { timestamp: now - 1000 });

            const result = shouldShowToast(cache, 0, 0, now, now, options);

            expect(result).toBe(false);
        });
    });

    describe('cache key generation', () => {
        it('should generate same key for identical title and description', () => {
            const key1 = getCacheKey('Error', 'Something went wrong');
            const key2 = getCacheKey('Error', 'Something went wrong');

            expect(key1).toBe(key2);
        });

        it('should generate different keys for different descriptions', () => {
            const key1 = getCacheKey('Error', 'First error');
            const key2 = getCacheKey('Error', 'Second error');

            expect(key1).not.toBe(key2);
        });

        it('should generate different keys for different titles', () => {
            const key1 = getCacheKey('Error', 'Something went wrong');
            const key2 = getCacheKey('Warning', 'Something went wrong');

            expect(key1).not.toBe(key2);
        });

        it('should handle empty description', () => {
            const key1 = getCacheKey('Error', '');
            const key2 = getCacheKey('Error', '');

            expect(key1).toBe(key2);
        });
    });
});
