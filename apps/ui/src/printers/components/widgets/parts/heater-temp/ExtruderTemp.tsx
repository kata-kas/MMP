import Printer3dNozzleHeatOutlineIcon from "mdi-react/Printer3dNozzleHeatOutlineIcon";
import { useContext, useEffect, useId } from "react";
import { SSEActionsContext, SSEConnectionContext } from "@/core/sse/SSEContext";
import { useCumulativeEvent } from "@/core/sse/useCumulativeEvent";
import type { Thermal } from "@/printers/entities/Printer";
import { Temp } from "../temp/Temp";

interface HeaterTempProps {
	printerUuid: string;
}

export function ExtruderTemp({ printerUuid }: HeaterTempProps) {
	const subscriberId = useId();
	const { connected } = useContext(SSEConnectionContext);
	const { subscribe, unsubscribe } = useContext(SSEActionsContext);
	const [extruder, setExtruder] = useCumulativeEvent<Thermal>({
		temperature: 0,
		target: 0,
	});
	useEffect(() => {
		if (!connected) return;
		setExtruder({ temperature: 0, target: 0 });
		const subscription = {
			subscriberId,
			provider: `printers/${printerUuid}`,
		};
		subscribe({
			...subscription,
			event: `printer.update.${printerUuid}.extruder`,
			callback: setExtruder,
		}).catch(() => {});
		return () => {
			unsubscribe(subscriberId);
		};
	}, [
		printerUuid,
		connected,
		subscriberId,
		subscribe,
		unsubscribe,
		setExtruder,
	]);
	return (
		<Temp
			icon={<Printer3dNozzleHeatOutlineIcon />}
			current={extruder?.temperature ?? 0}
			target={extruder?.target}
		/>
	);
}
