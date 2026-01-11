import { Widget } from "@/dashboard/entities/WidgetType";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContext } from "react";
import { SettingsContext } from "@/core/settings/settingsContext";
import { Printer } from "@/printers/entities/Printer";
import { ExtruderTemp } from "../parts/heater-temp/ExtruderTemp";
import { BedTemp } from "../parts/bed-temp/BedTemp";
import { PrintProgress } from "../parts/print-progress/PrintProgress";
import { PrintProgressBar } from "../parts/print-progress-bar/PrintProgressBar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useApiQuery } from "@/hooks/use-api-query";

export function PrinterWidget(w: Widget) {
    const { settings } = useContext(SettingsContext);
    const printerId = (w.config as { printer?: string }).printer;
    const { data: printer, loading } = useApiQuery<Printer>({
        url: printerId ? `/printers/${printerId}` : '',
        enabled: !!printerId,
    })
    const state = {};
    if (loading) return <>Loading...</>;
    return (
        <Card>
            <CardHeader className="p-0">
                <AspectRatio ratio={16 / 9}>
                    {printer?.camera_url ? (
                        <img
                            className="h-full w-full object-cover"
                            src={settings?.localBackend ? `${settings.localBackend}/printers/${(w.config as { printer?: string }).printer}/stream` : undefined}
                            alt={printer.name}
                        />
                    ) : (
                        <img
                            className="h-full w-full object-cover"
                            src={'https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80'}
                            alt="Default printer"
                        />
                    )}
                </AspectRatio>
            </CardHeader>

            <CardContent className="p-0">
                <PrintProgressBar printerUuid={(w.config as { printer?: string }).printer ?? ''} />
            </CardContent>
            
            <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                    <a 
                        href={printer?.address} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        {printer?.name}
                    </a>
                    <Badge variant="secondary" className="text-xs">
                        {printer?.status}
                    </Badge>
                </div>
            </CardHeader>
            
            <CardFooter className="flex justify-center gap-4">
                <ExtruderTemp printerUuid={(w.config as { printer?: string }).printer ?? ''} />
                <BedTemp printerUuid={(w.config as { printer?: string }).printer ?? ''} />
                <PrintProgress state={state} />
            </CardFooter>
        </Card>
    )
}
