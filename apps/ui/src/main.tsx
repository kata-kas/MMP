import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./core/error-boundary/ErrorBoundary";
import { Z_INDEX } from "./core/z-index";

import { routes as dashboardRoutes } from "./dashboard/routes.tsx";
import { routes as printersRoutes } from "./printers/routes.tsx";
import { routes as assetRoutes } from "./assets/routes.tsx";
import { routes as projectRoutes } from "./projects/routes.tsx";
import { routes as settingsRoutes } from "./settings/routes.tsx";
import { routes as tempFilesRoutes } from "./tempfiles/routes.tsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				path: "",
				children: dashboardRoutes,
			},
			{
				path: "assets",
				children: assetRoutes,
			},
			{
				path: "projects",
				children: projectRoutes,
			},
			{
				path: "tempfiles",
				children: tempFilesRoutes,
			},
			{
				path: "printers",
				children: printersRoutes,
			},
			{
				path: "settings",
				children: settingsRoutes,
			},
		],
	},
]);

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}
ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ErrorBoundary>
			<ThemeProvider defaultTheme="dark" attribute="class" enableSystem>
				<Suspense
					fallback={
						<div
							className="fixed inset-0 flex items-center justify-center bg-background"
							style={{ zIndex: Z_INDEX.LOADING }}
						>
							<Skeleton className="h-12 w-12 rounded-full" />
						</div>
					}
				>
					<RouterProvider router={router} />
				</Suspense>
				<Toaster />
			</ThemeProvider>
		</ErrorBoundary>
	</React.StrictMode>,
);
