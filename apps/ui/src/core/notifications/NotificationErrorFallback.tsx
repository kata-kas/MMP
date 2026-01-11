import { logger } from '@/lib/logger';

interface NotificationErrorFallbackProps {
    error: Error;
    reset: () => void;
}

export function NotificationErrorFallback({ error }: NotificationErrorFallbackProps) {
    logger.warn('Notification system failed to load:', error);
    return null;
}
