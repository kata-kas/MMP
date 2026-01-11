import { useSettings } from "@/core/settings/useSettings";
import { IconPrinter } from "@tabler/icons-react";
import { Printer } from "@/printers/entities/Printer";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import useAxios from "axios-hooks";
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

type SentToPrinterBtnProps = {
    id: string
}

export function SendToPrinterBtn({ id }: SentToPrinterBtnProps) {
    const { settings } = useSettings();
    const [printers, setPrinters] = useState<Printer[]>([])
    const [{ data, loading }] = useAxios<Printer[]>({ url: `${settings.localBackend}/printers` })
    const [{ loading: sLoading }, executeSendToPrinter] = useAxios({}, { manual: true })
    useEffect(() => {
        if (!data) return;
        setPrinters(data)
    }, [data])

    function sentToPrinter(p: Printer) {
        executeSendToPrinter({
            url: `${settings.localBackend}/printers/${p.uuid}/send/${id}`
        })
            .then(() => {
                toast.success('Great Success!', {
                    description: 'File sent to printer!',
                })
            })
            .catch((e) => {
                logger.error(e)
            });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading || sLoading}>
                    <IconPrinter className="h-4 w-4" stroke={1.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {printers.map((p, i) => (
                    <DropdownMenuItem key={i} onClick={() => sentToPrinter(p)}>
                        {p.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
