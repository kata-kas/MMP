import { useId } from "react";
import { Temp } from "../temp/Temp";
import RadiatorDisabledIcon from "mdi-react/RadiatorDisabledIcon";
import SSEContext from "@/core/sse/SSEContext";
import { useCumulativeEvent } from "@/core/sse/useCumulativeEvent";
import { Thermal } from "@/printers/entities/Printer";
import { useContext, useEffect } from "react";

interface BedTempProps {
    printerUuid: string;
}

export function BedTemp({ printerUuid }: BedTempProps) {
    const subscriberId = useId();
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [bed, setBed] = useCumulativeEvent<Thermal>({ temperature: 0, target: 0 });
    useEffect(() => {
        if (!connected) return;
        setBed({ temperature: 0, target: 0 });
        const subscription = {
            subscriberId,
            provider: `printers/${printerUuid}`,
        }
        subscribe({
            ...subscription,
            event: `printer.update.${printerUuid}.bed`,
            callback: setBed
        }).catch(() => {});
        return () => {
            unsubscribe(subscriberId)
        }
    }, [printerUuid, connected, subscriberId, subscribe, unsubscribe, setBed])
    return (
        <Temp icon={<RadiatorDisabledIcon />} current={bed?.temperature ?? 0} target={bed?.target} />
    )
}
