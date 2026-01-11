import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useMap } from "@/core/utils/useMap";
import type { Widget, WidgetType } from "../entities/WidgetType";
import { dashboardContext } from "./DashboardContext";

interface DashboardContextType {
	widgets: Widget[];
	setWidgets: (widgets: Widget[]) => void;
	layout: Record<string, unknown>;
	setLayout: (layout: Record<string, unknown>) => void;
	widgetTypes: Map<string, WidgetType>;
	addWidgetType: (widgetType: WidgetType) => void;
}
export function DashboardProvider({ children }: React.PropsWithChildren) {
	const [widgets, setWidgets] = useLocalStorage<Widget[]>(
		"dashboard-widgets",
		[],
	);
	const [layout, setLayout] = useLocalStorage<Record<string, unknown>>(
		"dashboard-layout",
		{},
	);
	const [widgetTypes, { set: addWidgetTypeMap }] = useMap<string, WidgetType>(
		[],
	);

	const addWidgetType = useCallback(
		(widgetType: WidgetType) => {
			addWidgetTypeMap(widgetType.type, widgetType);
		},
		[addWidgetTypeMap],
	);

	const contextValue: DashboardContextType = useMemo(
		() => ({
			widgets,
			setWidgets,
			layout,
			setLayout,
			widgetTypes: widgetTypes as Map<string, WidgetType>,
			addWidgetType,
		}),
		[widgets, setWidgets, layout, setLayout, widgetTypes, addWidgetType],
	);

	return (
		<dashboardContext.Provider value={contextValue}>
			{children}
		</dashboardContext.Provider>
	);
}
