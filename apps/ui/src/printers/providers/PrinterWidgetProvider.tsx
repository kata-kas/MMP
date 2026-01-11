import { IconPrinter } from "@tabler/icons-react";
import { useContext, useEffect, useRef } from "react";
import type { Widget, WidgetConfig } from "@/dashboard/entities/WidgetType";
import { dashboardContext } from "@/dashboard/provider/DashboardContext";
import { PrinterWidgetConfig } from "../components/widgets/configs/PrinterWidgetConfig";
import { PrinterTableWidget } from "../components/widgets/printer-table-widget/PrinterTableWidget";
import { PrinterWidget } from "../components/widgets/printer-widget/PrinterWidget";

export function PrinterWidgetProvider() {
	const { addWidgetType } = useContext(dashboardContext);
	const hasRegistered = useRef(false);

	useEffect(() => {
		if (hasRegistered.current) {
			return;
		}

		addWidgetType({
			name: "Camera Widget",
			type: "printer_camera_widget",
			description: "Printer Camera Widget",
			icon: <IconPrinter />,
			element: <PrinterWidget {...({} as Widget)} />,
			configElement: <PrinterWidgetConfig {...({} as WidgetConfig)} />,
			layout: { h: 6, w: 3, isResizable: true },
		});
		addWidgetType({
			name: "Table Widget",
			type: "printer_table_widget",
			description: "Printer table Widget",
			icon: <IconPrinter />,
			element: <PrinterTableWidget {...({} as Widget)} />,
			configElement: <PrinterWidgetConfig {...({} as WidgetConfig)} />,
			layout: { h: 5, w: 2, isResizable: true },
		});
		hasRegistered.current = true;
	}, [addWidgetType]);

	return null;
}
