import { IconTrash } from "@tabler/icons-react";
import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Widget as WidgetModel } from "@/dashboard/entities/WidgetType";
import { dashboardContext } from "@/dashboard/provider/DashboardContext";

export interface WidgetProps {
	model: WidgetModel;
	edit: boolean;
	onDelete: () => void;
}

export function Widget({ model, edit, onDelete }: WidgetProps) {
	const { widgetTypes } = useContext(dashboardContext) as {
		widgetTypes: Map<
			string,
			{
				name?: string;
				element: React.ReactElement;
				configElement: React.ReactElement;
			}
		>;
	};
	const widgetType = widgetTypes.get(model.type);
	const [config, setConfig] = useState(model.config);
	const w = widgetType
		? React.cloneElement(widgetType.element, { config, onChange: () => {} })
		: null;
	const c = widgetType
		? React.cloneElement(widgetType.configElement, {
				config,
				onChange: setConfig,
			})
		: null;

	return (
		<div className="absolute inset-0 flex w-full">
			{edit && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 p-3">
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<p className="text-white">{widgetType?.name ?? ""}</p>
							<Button
								variant="ghost"
								size="icon"
								onClick={onDelete}
								className="text-white hover:bg-white/20"
							>
								<IconTrash className="h-4 w-4" />
							</Button>
						</div>
						{c}
					</div>
				</div>
			)}
			{w}
		</div>
	);
}
