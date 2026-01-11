import { lazy } from "react";

const TempFiles = lazy(() =>
	import("./components/temp-files/TempFiles.tsx").then((m) => ({
		default: m.TempFiles,
	})),
);

export const routes = [
	{
		path: "",
		index: true,
		element: <TempFiles />,
	},
];
