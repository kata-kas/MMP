import { dashboardContext } from "./DashboardContext";
import { Widget, WidgetType } from "../entities/WidgetType";
import { useLocalStorage } from "usehooks-ts";
import { useMap } from "@/core/utils/useMap";

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
    const [widgetTypes, { set: addWidgetType }] = useMap<string, WidgetType>([])

    const contextValue: DashboardContextType = {
        widgets,
        setWidgets,
        layout,
        setLayout,
        widgetTypes: widgetTypes as Map<string, WidgetType>,
        addWidgetType: (widgetType: WidgetType) => addWidgetType(widgetType.type, widgetType) as void
    }   
    return (
        <dashboardContext.Provider value={contextValue}>
            {children}
        </dashboardContext.Provider>
    )
}