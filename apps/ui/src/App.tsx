import { lazy, Suspense } from "react";
import { AppSidebar } from "./components/app-sidebar";
import { Outlet } from "react-router-dom";
import { ScrollToTop } from './core/scroll-to-top/ScrollToTop.tsx';
import { DashboardProvider } from './dashboard/provider/DashboardProvider.tsx';
import { PrinterWidgetProvider } from './printers/providers/PrinterWidgetProvider.tsx';
import { SSEProvider } from './core/sse/SSEProvider.tsx';
import { SettingsProvider } from './core/settings/settingsProvider.tsx';
import { ToastProvider } from './core/toast/ToastContext';
import { OfflineProvider } from './core/offline/OfflineContext';
import { AxiosErrorInterceptor } from './core/axios-error-handler/AxiosErrorInterceptor';
import { Skeleton } from './components/ui/skeleton';
import { ErrorBoundary } from './core/error-boundary/ErrorBoundary';
import { SettingsErrorFallback } from './core/error-boundary/SettingsErrorFallback';
import { NotificationErrorFallback } from './core/notifications/NotificationErrorFallback';
import { Breadcrumbs } from './core/breadcrumbs/Breadcrumbs';
import { Z_INDEX } from './core/z-index';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const Notifications = lazy(() => import('./core/notifications/Notifications'));

const LoadingFallback = () => (
    <div 
        className="fixed inset-0 flex items-center justify-center bg-background"
        style={{ zIndex: Z_INDEX.LOADING }}
    >
        <Skeleton className="h-12 w-12 rounded-full" />
    </div>
);

const NotificationLoadingFallback = () => null;

export default function App() {
    return (
        <SettingsProvider loading={<LoadingFallback />}>
            <ErrorBoundary fallback={SettingsErrorFallback}>
                <ToastProvider>
                    <OfflineProvider>
                        <AxiosErrorInterceptor />
                        <SSEProvider>
                            <DashboardProvider>
                                <PrinterWidgetProvider />
                                <SidebarProvider>
                                    <AppSidebar />
                                    <SidebarInset>
                                        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                                            <SidebarTrigger className="-ml-1" />
                                            <Separator
                                                orientation="vertical"
                                                className="mr-2 data-[orientation=vertical]:h-4"
                                            />
                                            <Breadcrumbs />
                                        </header>
                                        <div className="flex flex-1 flex-col gap-4 p-4">
                                            <Suspense fallback={<LoadingFallback />}>
                                                <ErrorBoundary>
                                                    <Outlet />
                                                </ErrorBoundary>
                                            </Suspense>
                                        </div>
                                    </SidebarInset>
                                </SidebarProvider>
                                <ScrollToTop />
                                <ErrorBoundary fallback={NotificationErrorFallback}>
                                    <Suspense fallback={<NotificationLoadingFallback />}>
                                        <Notifications />
                                    </Suspense>
                                </ErrorBoundary>
                            </DashboardProvider>
                        </SSEProvider>
                    </OfflineProvider>
                </ToastProvider>
            </ErrorBoundary>
        </SettingsProvider>
    );
}
