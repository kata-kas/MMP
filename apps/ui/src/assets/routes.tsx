import { lazy } from "react";

const AssetsPage = lazy(() =>
	import("./components/assets-page/AssetsPage.tsx").then((m) => ({
		default: m.AssetsPage,
	})),
);
const AssetPage = lazy(() =>
	import("./components/asset-page/AssetPage.tsx").then((m) => ({
		default: m.AssetPage,
	})),
);
const AssetsList = lazy(() =>
	import("./components/assets-page/parts/assets-list/AssetsList.tsx").then(
		(m) => ({ default: m.AssetsList }),
	),
);

export const routes = [
	{
		path: "",
		element: <AssetsPage />,
		children: [
			{
				path: "",
				index: true,
				element: <AssetsList />,
			},
			{
				path: "list",
				element: <AssetsList />,
			},
		],
	},
	{
		path: ":id",
		element: <AssetPage />,
	},
];
