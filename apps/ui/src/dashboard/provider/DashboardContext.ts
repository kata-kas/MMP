import { createContext } from "react";
import { Widget, WidgetType } from "../entities/WidgetType";

interface DashboardContextType {
    widgetTypes: Map<string, WidgetType>;
    addWidgetType: (widgetTypes: WidgetType) => void;
    widgets: Widget[];
    setWidgets: (widgets: Widget[]) => void;
    layout: Record<string, unknown>
    setLayout: (layout: Record<string, unknown>) => void;
}

export const dashboardContext = createContext<DashboardContextType>({} as DashboardContextType)