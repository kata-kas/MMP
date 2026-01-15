import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { Skeleton } from "./components/ui/skeleton";
import { AxiosErrorInterceptor } from "./core/axios-error-handler/AxiosErrorInterceptor";
import { ErrorBoundary } from "./core/error-boundary/ErrorBoundary";
import { SettingsErrorFallback } from "./core/error-boundary/SettingsErrorFallback";
import { NotificationErrorFallback } from "./core/notifications/NotificationErrorFallback";
import { OfflineProvider } from "./core/offline/OfflineContext";
import { ScrollToTop } from "./core/scroll-to-top/ScrollToTop.tsx";
import { SettingsProvider } from "./core/settings/settingsProvider.tsx";
import { SSEProvider } from "./core/sse/SSEProvider.tsx";
import { SearchDialog } from "./core/search/SearchDialog";
import {
	setSearchDialogOpen,
	useSearchDialogOpen,
} from "./core/search/searchDialogStore";
import { ToastProvider } from "./core/toast/ToastContext";
import { Z_INDEX } from "./core/z-index";
import { DashboardProvider } from "./dashboard/provider/DashboardProvider.tsx";
import { PrinterWidgetProvider } from "./printers/providers/PrinterWidgetProvider.tsx";
import { BreadcrumbProvider } from "./core/breadcrumbs/BreadcrumbContext";

const Notifications = lazy(() => import("./core/notifications/Notifications"));

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
	const searchOpen = useSearchDialogOpen();

	return (
		<SettingsProvider loading={<LoadingFallback />}>
			<BreadcrumbProvider>
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
											<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
												<Suspense fallback={<LoadingFallback />}>
													<ErrorBoundary>
														<div className="min-h-0 flex-1 overflow-auto">
															<Outlet />
														</div>
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
			</BreadcrumbProvider>
			<SearchDialog open={searchOpen} onOpenChange={setSearchDialogOpen} />
		</SettingsProvider>
	);
}
