import { WidgetConfig } from "@/dashboard/entities/WidgetType";
import { Printer } from "@/printers/entities/Printer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";

export function PrinterWidgetConfig({ config, onChange }: WidgetConfig) {
    const [cfg, setCfg] = useState(config)
    const { data, loading } = useApiQuery<Printer[]>({
        url: '/printers',
    })

    const proxyOnChange = (v: string) => {
        const c = { ...cfg, printer: v } as unknown
        setCfg(c)
        onChange(c)
    }

    return (
        <div className="space-y-2">
            <Label>Select Printer</Label>
            <Select
                value={(cfg as { printer?: string })?.printer || ""}
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
