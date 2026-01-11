import { lazy } from "react";

const Dashboard = lazy(() =>
	import("./components/dashboard/Dashboard.tsx").then((m) => ({
		default: m.Dashboard,
	})),
);

export const routes = [
	{
		path: "/",
		index: true,
		element: <Dashboard />,
	},
];
