import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/core/header/Header";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Printer } from "@/printers/entities/Printer";
import { PrinterForm } from "../parts/printer-form/PrinterForm";

export function EditPrinterPage() {
	const navigate = useNavigate();
	const { id } = useParams();

	const { data } = useApiQuery<Printer>({
		url: `/printers/${id}`,
		enabled: !!id,
	});
	return (
		<>
			<Header
				title={data?.name}
				imagePath={
					"https://images.unsplash.com/photo-1611117775350-ac3950990985?q=80&w=2000&h=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				}
			/>
			<div className="container mx-auto mt-4 max-w-4xl">
				<PrinterForm
					printer={data}
					onPrinterChange={(p: Printer) => {
						navigate(`/printers/${p.uuid}`);
					}}
				/>
			</div>
		</>
	);
}
