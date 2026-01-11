import { lazy } from "react";

const SettingsPage = lazy(() =>
	import("./components/settings-page/SettingsPage").then((m) => ({
		default: m.SettingsPage,
	})),
);

export const routes = [
	{
		path: "",
		index: true,
		element: <SettingsPage />,
	},
];
