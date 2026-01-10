import { dashboardContext } from "./DashboardContext";
import { Widget, WidgetType } from "../entities/WidgetType";
import { useLocalStorage } from "usehooks-ts";
import { useMap } from "@/core/utils/useMap";
import { useCallback, useMemo } from "react";

interface DashboardContextType {
    widgets: Widget[];
    setWidgets: (widgets: Widget[]) => void;
    layout: Record<string, unknown>;
    setLayout: (layout: Record<string, unknown>) => void;
    widgetTypes: Map<string, WidgetType>;
    addWidgetType: (widgetType: WidgetType) => void;
}
export function DashboardProvider({ children }: React.PropsWithChildren) {
    const [widgets, setWidgets] = useLocalStorage<Widget[]>('dashboard-widgets', [])
    const [layout, setLayout] = useLocalStorage<Record<string, unknown>>('dashboard-layout', {})
    const [widgetTypes, { set: addWidgetTypeMap }] = useMap<string, WidgetType>([])

    const addWidgetType = useCallback((widgetType: WidgetType) => {
        addWidgetTypeMap(widgetType.type, widgetType);
    }, [addWidgetTypeMap]);

    const contextValue: DashboardContextType = useMemo(() => ({
        widgets,
        setWidgets,
        layout,
        setLayout,
        widgetTypes: widgetTypes as Map<string, WidgetType>,
        addWidgetType
    }), [widgets, setWidgets, layout, setLayout, widgetTypes, addWidgetType]);
   
    return (
        <dashboardContext.Provider value={contextValue}>
            {children}
        </dashboardContext.Provider>
    )
}