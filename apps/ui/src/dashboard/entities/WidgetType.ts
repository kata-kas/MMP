import { Layout } from "react-grid-layout";

export interface DashboardItem {
  widget: Widget,
  layout: Layout
}

export interface WidgetType {
  name: string,
  description: string,
  type: string,
  icon: React.ReactElement,
  element: React.ReactElement,
  configElement: React.ReactElement,
  layout: {
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    isResizable?: boolean;
  }
}

export interface Widget {
  id: string,
  type: string,
  config: unknown,
  layout: Layout
}

export interface WidgetConfig {
  config: unknown,
  onChange: (config: unknown) => void
}