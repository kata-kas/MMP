import { useCallback } from "react";
import { dashboardContext } from "./DashboardContext";
import { Widget, WidgetType } from "../entities/WidgetType";
import { useLocalStorage } from "usehooks-ts";
import { useMap } from "@/core/utils/useMap";
import { Layout } from "react-grid-layout";

export function DashboardProvider({ children }: any) {
    const [widgets, setWidgets] = useLocalStorage<Widget[]>('dashboard-widgets', [])
    const [layout, setLayout] = useLocalStorage<any>('dashboard-layout', {})
    const [widgetTypes, actions] = useMap<string, WidgetType>([])

    const addWidgetType = useCallback((widgetType: WidgetType) => {
        actions.set(widgetType.type, widgetType)
    }, [actions])



    return (
        <dashboardContext.Provider value={{ widgets, setWidgets, layout, setLayout, widgetTypes, addWidgetType }}>
            {children}
        </dashboardContext.Provider>
    )
}