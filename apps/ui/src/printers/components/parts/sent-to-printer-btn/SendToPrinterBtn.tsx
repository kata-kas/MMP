import { IconPrinter } from "@tabler/icons-react";
import { Printer } from "@/printers/entities/Printer";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";

type SentToPrinterBtnProps = {
    id: string
}

export function SendToPrinterBtn({ id }: SentToPrinterBtnProps) {
    const { data: printers, loading } = useApiQuery<Printer[]>({
        url: '/printers',
    });

    const sendToPrinterMutation = useApiMutation<void, { printerUuid: string; fileId: string }>({
        url: (vars) => `/printers/${vars.printerUuid}/send/${vars.fileId}`,
        method: 'post',
    });

    function sentToPrinter(p: Printer) {
        sendToPrinterMutation.mutate({ printerUuid: p.uuid, fileId: id })
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
                <Button variant="ghost" size="icon" disabled={loading || sendToPrinterMutation.loading}>
                    <IconPrinter className="h-4 w-4" stroke={1.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {printers?.map((p) => (
                    <DropdownMenuItem key={p.uuid} onClick={() => sentToPrinter(p)}>
                        {p.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
