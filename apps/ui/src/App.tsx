import { AppSidebar } from "./components/app-sidebar";
import { Outlet, useLocation, Link } from "react-router-dom";
import { ScrollToTop } from './core/scroll-to-top/ScrollToTop.tsx';
import { DashboardProvider } from './dashboard/provider/DashboardProvider.tsx';
import { PrinterWidgetProvider } from './printers/providers/PrinterWidgetProvider.tsx';
import { SSEProvider } from './core/sse/SSEProvider.tsx';
import { SettingsProvider } from './core/settings/settingsProvider.tsx';
import { DiscoveryNotifications } from './system/components/discovery-notifications/DiscoveryNotifications.tsx';
import { NewProjectNotification } from './projects/notifications/new-project-notification/NewProjectNotification.tsx';
import { NewTempfileNotification } from './tempfiles/notifications/new-tempfile-notification/NewTempfileNotification.tsx';
import { Skeleton } from './components/ui/skeleton';
import { ErrorBoundary } from './core/error-boundary/ErrorBoundary';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    const breadcrumbMap: Record<string, string> = {
        'projects': 'Projects',
        'tempfiles': 'Temp Files',
        'printers': 'Printers',
        'settings': 'Settings',
        'new': 'New',
        'import': 'Import',
        'list': 'List',
    };

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathnames.length === 0 ? (
                    <BreadcrumbItem>
                        <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                ) : (
                    <>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink asChild>
                                <Link to="/">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {pathnames.map((name, index) => {
                            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                            const isLast = index === pathnames.length - 1;
                            const displayName = breadcrumbMap[name] || name;

                            return (
                                <div key={routeTo} className="flex items-center">
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{displayName}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link to={routeTo}>{displayName}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            );
                        })}
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

export default function App() {
    return (
        <SettingsProvider
            loading={
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background">
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            }
        >
            <SSEProvider>
                <DashboardProvider>
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
                                <ErrorBoundary>
                                    <Outlet />
                                </ErrorBoundary>
                            </div>
                        </SidebarInset>
                    </SidebarProvider>
                    <ScrollToTop />
                    <NewProjectNotification />
                    <DiscoveryNotifications />
                    <NewTempfileNotification />
                    <PrinterWidgetProvider />
                </DashboardProvider>
            </SSEProvider>
        </SettingsProvider>
    )
}
