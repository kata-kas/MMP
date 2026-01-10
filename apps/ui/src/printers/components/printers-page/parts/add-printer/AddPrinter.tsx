import { Printer } from "@/printers/entities/Printer";
import { PrinterForm } from "../../../parts/printer-form/PrinterForm";
import { useNavigate } from "react-router-dom";

export function AddPrinter() {
    const navigate = useNavigate();
    return (
        <div className="container mx-auto max-w-4xl">
            <PrinterForm printer={{ name: '', type: '', address: '' } as Printer} onPrinterChange={function (p: Printer): void {
                navigate("/printers")
            }} />
        </div>
    )
}
