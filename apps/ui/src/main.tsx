import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from './core/error-boundary/ErrorBoundary';

import { routes as dashboardRoutes } from "./dashboard/routes.tsx";
import { routes as projectRoutes } from "./projects/routes.tsx";
import { routes as tempFilesRoutes } from "./tempfiles/routes.tsx";
import { routes as printersRoutes } from "./printers/routes.tsx";
import { routes as settingsRoutes } from "./settings/routes.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "",
                children: [...dashboardRoutes]
            },
            {
                path: "projects",
                children: [...projectRoutes]
            },
            {
                path: "tempfiles",
                children: [...tempFilesRoutes]
            },
            {
                path: "printers",
                children: [...printersRoutes]
            },
            {
                path: "settings",
                children: [...settingsRoutes]
            },
        ],
    },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider defaultTheme="dark" attribute="class" enableSystem>
                <RouterProvider router={router} />
                <Toaster />
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>
)
