import { Widget } from "@/dashboard/entities/WidgetType";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useContext, useEffect } from "react";
import { useSettings } from "@/core/settings/useSettings";
import { Job, Printer, Thermal } from "@/printers/entities/Printer";
import useAxios from "axios-hooks";
import { PrintProgressBar } from "../parts/print-progress-bar/PrintProgressBar";
import Printer3dNozzleHeatOutlineIcon from "mdi-react/Printer3dNozzleHeatOutlineIcon";
import { IconFile3d, IconPercentage, IconSkateboarding } from "@tabler/icons-react";
import RadiatorDisabledIcon from "mdi-react/RadiatorDisabledIcon";
import { SSEContext } from "@/core/sse/SSEContext";
import { useCumulativeEvent } from "@/core/sse/useCumulativeEvent";
import { useId } from 'react';

export function PrinterTableWidget(w: Widget) {
    const { settings } = useSettings();
    const subscriberId = useId();
    const printerId = (w.config as { printer?: string }).printer;
    const [{ data: printer, loading }] = useAxios<Printer>(
        printerId ? { url: `${settings.localBackend}/printers/${printerId}` } : null,
        { skip: !printerId }
    )
    const { connected, subscribe, unsubscribe } = useContext(SSEContext)
    const [extruder, setExtruder] = useCumulativeEvent<Thermal>({ temperature: 0 });
    const [heaterBed, setHeaterBed] = useCumulativeEvent<Thermal>({ temperature: 0 });
    const [job, setJob] = useCumulativeEvent<Job>({ progress: 0, fileName: "", message: "" });
    
    useEffect(() => {
        if (!connected) return;
        setExtruder({ temperature: 0 });
        setHeaterBed({ temperature: 0 });
        const subscription = {
            subscriberId,
            provider: `printers/${(w.config as { printer?: string }).printer}`,
        }
        const printerUuid = (w.config as { printer?: string }).printer;
        if (printerUuid) {
            subscribe({
                ...subscription,
                event: `printer.update.${printerUuid}.extruder`,
                callback: setExtruder
            }).catch(() => {});
            subscribe({
                ...subscription,
                event: `printer.update.${printerUuid}.bed`,
                callback: setHeaterBed
            }).catch(() => {});
            subscribe({
                ...subscription,
                event: `printer.update.${printerUuid}.job_status`,
                callback: setJob
            }).catch(() => {});
        }
        return () => {
            unsubscribe(subscriberId)
        }
    }, [w.config, connected, subscriberId, subscribe, unsubscribe, setExtruder, setHeaterBed, setJob])

    if (loading) return <>Loading...</>;
    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <a href={printer?.address} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {printer?.name}
                    </a>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <PrintProgressBar printerUuid={(w.config as { printer?: string }).printer ?? ''} />
            </CardContent>
            <div className="border-t p-3">
                <div className="flex items-center justify-between">
                    <IconSkateboarding className="h-4 w-4" />
                    <p className="font-medium">{job.message}</p>
                </div>
            </div>
            <Separator />
            <div className="border-t p-3">
                <div className="flex items-center justify-between gap-2">
                    <IconFile3d className="h-4 w-4 flex-shrink-0" />
                    <p className="font-medium truncate">{job.fileName}</p>
                </div>
            </div>
            <Separator />
            <div className="border-t p-3">
                <div className="flex items-center justify-between">
                    <IconPercentage className="h-4 w-4" />
                    <p className="font-medium">Progress</p>
                    <p className="font-medium">{(job.progress * 100).toFixed(2)}%</p>
                </div>
            </div>
            <Separator />
            <div className="border-t p-3">
                <div className="flex items-center justify-between">
                    <Printer3dNozzleHeatOutlineIcon className="h-4 w-4" />
                    <p className="font-medium">Nozzle</p>
                    <p className="font-medium">{(extruder.temperature ?? 0).toFixed(1)}°C</p>
                </div>
            </div>
            <Separator />
            <div className="border-t p-3">
                <div className="flex items-center justify-between">
                    <RadiatorDisabledIcon className="h-4 w-4" />
                    <p className="font-medium">Bed</p>
                    <p className="font-medium">{(heaterBed?.temperature ?? 0).toFixed(1)}°C</p>
                </div>
            </div>
        </Card>
    )
}
