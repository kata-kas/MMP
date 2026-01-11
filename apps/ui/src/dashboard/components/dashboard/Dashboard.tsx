import { Header } from "./parts/header/Header";
import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";
import { useContext, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { dashboardContext } from "@/dashboard/provider/DashboardContext";
import { Widget } from "./parts/widget/Widget";

const ReactGridLayout = WidthProvider(Responsive);

export function Dashboard() {
	const { widgets, setWidgets, layout, setLayout } = useContext(
		dashboardContext,
	) as {
		widgets: unknown[];
		setWidgets: (w: unknown[]) => void;
		layout: unknown;
		setLayout: (l: unknown) => void;
	};
	const [locked, setLocked] = useState(true);
	const [edit, setEdit] = useState(false);

	const toggleLocked = () => setLocked((prev) => !prev);
	const toggleEdit = () => setEdit((prev) => !prev);

	const deleteWidget = (index: number) => {
		setWidgets(widgets.filter((_, i) => i !== index));
	};

	return (
		<>
			<Header
				locked={locked}
				toggleLock={toggleLocked}
				edit={edit}
				toggleEdit={toggleEdit}
				addItem={(item) => {
					setWidgets([...widgets, item.widget]);
				}}
			/>
			<ReactGridLayout
				className="layout"
				isDraggable={!locked}
				isResizable={!locked}
				onLayoutChange={(_l, ls) => {
					setLayout(ls);
				}}
				layouts={layout}
				breakpoints={{ xlg: 1900, lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
				cols={{ xlg: 16, lg: 12, md: 6, sm: 4, xs: 2, xxs: 1 }}
				rowHeight={50}
			>
				{widgets.map((widget, i) => {
					const w = widget as { id: string; layout: unknown };
					return (
						<div key={w.id} data-grid={w.layout}>
							<Widget
								model={widget}
								edit={edit}
								onDelete={() => {
									deleteWidget(i);
								}}
							/>
						</div>
					);
				})}
			</ReactGridLayout>
		</>
	);
}
