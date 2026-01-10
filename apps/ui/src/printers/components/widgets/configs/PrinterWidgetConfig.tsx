import { SettingsContext } from "@/core/settings/settingsContext";
import { WidgetConfig } from "@/dashboard/entities/WidgetType";
import { Printer } from "@/printers/entities/Printer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import useAxios from "axios-hooks";
import { useContext, useRef, useState } from "react";

export function PrinterWidgetConfig({ config, onChange }: WidgetConfig) {
    const [cfg, setCfg] = useState(config)
    const reload = useRef(Math.floor(1000 + Math.random() * 9000));
    const { settings } = useContext(SettingsContext);
    const [{ data, loading, error }] = useAxios<Printer[]>({ url: `${settings.localBackend}/printers?_=${reload.current}` })

    const proxyOnChange = (v: string) => {
        const c = { ...cfg, printer: v }
        setCfg(c)
        onChange(c)
    }

    return (
        <div className="space-y-2">
            <Label>Select Printer</Label>
            <Select
                value={cfg?.printer || ""}
                onValueChange={proxyOnChange}
                disabled={loading}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                    {data?.map(p => (
                        <SelectItem key={p.uuid} value={p.uuid}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
