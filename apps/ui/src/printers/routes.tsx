import { lazy } from "react";

const EditPrinterPage = lazy(() =>
	import("./components/edit-printer-page/EditPrinterPage").then((m) => ({
		default: m.EditPrinterPage,
	})),
);
const PrintersPage = lazy(() =>
	import("./components/printers-page/PrintersPage").then((m) => ({
		default: m.PrintersPage,
	})),
);

export const routes = [
	{
		path: "",
		index: true,
		element: <PrintersPage />,
	},
	{
		path: ":id",
		element: <EditPrinterPage />,
	},
];
