import { useEffect } from 'react';
import { setupAxiosErrorInterceptor } from './setup-axios-interceptor';
import { useToast } from '../toast/ToastContext';
import { useOffline } from '../offline/OfflineContext';

interface AxiosErrorInterceptorProps {
    showErrorToast?: (options: { title: string; description: string; duration: number }) => void;
    isOffline?: boolean;
}

export function AxiosErrorInterceptor({ 
    showErrorToast: injectedShowErrorToast,
    isOffline: injectedIsOffline 
}: AxiosErrorInterceptorProps = {}) {
    const toastContext = useToast();
    const offlineContext = useOffline();
    
    const showErrorToast = injectedShowErrorToast ?? toastContext.showErrorToast;
    const isOffline = injectedIsOffline ?? offlineContext.isOffline;

    useEffect(() => {
        const cleanup = setupAxiosErrorInterceptor(showErrorToast, isOffline);
        return cleanup;
    }, [showErrorToast, isOffline]);

    return null;
}
