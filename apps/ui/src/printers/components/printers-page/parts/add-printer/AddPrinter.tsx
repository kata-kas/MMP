import { useNavigate } from "react-router-dom";
import type { Printer } from "@/printers/entities/Printer";
import { PrinterForm } from "../../../parts/printer-form/PrinterForm";

export function AddPrinter() {
	const navigate = useNavigate();
	return (
		<div className="container mx-auto max-w-4xl">
			<PrinterForm
				printer={{ name: "", type: "", address: "" } as Printer}
				onPrinterChange={(): void => {
					navigate("/printers");
				}}
			/>
		</div>
	);
}
