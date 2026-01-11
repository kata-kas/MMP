import { IconPlugConnected } from "@tabler/icons-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { logger } from "@/lib/logger";
import { type Printer, printerTypes } from "@/printers/entities/Printer";

type PrinterFormProps = {
	printer?: Printer;
	onPrinterChange: (p: Printer) => void;
};

export function PrinterForm({ printer, onPrinterChange }: PrinterFormProps) {
	const form = useForm({
		defaultValues: {
			name: "",
			type: "",
			address: "",
			apiKey: "",
		},
	});

	const savePrinterMutation = useApiMutation<Printer, Printer>({
		url: printer?.uuid ? `/printers/${printer.uuid}` : "/printers",
		method: "post",
	});

	const testPrinterMutation = useApiMutation<
		{ version?: string; state?: string; status?: string },
		{ address: string; type: string }
	>({
		url: "/printers/test",
		method: "post",
	});

	useEffect(() => {
		if (!printer) return;
		form.reset(printer);
	}, [printer, form]);

	const onSave = (data: Printer) => {
		savePrinterMutation
			.mutate(data)
			.then((savedPrinter) => {
				onPrinterChange(savedPrinter);
				toast.success("Great Success!", {
					description: "Project updated",
				});
			})
			.catch((e) => {
				logger.error(e);
			});
	};

	const connect = () => {
		const values = form.getValues() as { address: string; type: string };
		if (values.address !== "" && values.type !== "") {
			const tyype = printerTypes.get(values.type);
			if (!tyype) return;
			testPrinterMutation
				.mutate(values)
				.then((responseData) => {
					if (responseData.version)
						form.setValue("version", responseData.version);
					if (responseData.state) form.setValue("state", responseData.state);
					if (responseData.status) form.setValue("status", responseData.status);
				})
				.catch((e) => {
					logger.error(e);
				});
		}
	};

	return (
		<form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					{...form.register("name", {
						required: "Name is required",
						minLength: { value: 3, message: "Use at least 3 characters" },
					})}
				/>
				{form.formState.errors.name && (
					<p className="text-sm text-destructive">
						{form.formState.errors.name.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="type">Type</Label>
				<Select
					value={form.watch("type")}
					onValueChange={(value) => form.setValue("type", value)}
				>
					<SelectTrigger id="type">
						<SelectValue placeholder="Select type" />
					</SelectTrigger>
					<SelectContent>
						{Array.from(printerTypes.values()).map((t: { type: string }) => (
							<SelectItem key={t.type} value={t.type}>
								{t.type}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{form.formState.errors.type && (
					<p className="text-sm text-destructive">
						{form.formState.errors.type.message}
					</p>
				)}
			</div>

			{form.watch("type") === "octoPrint" && (
				<div className="space-y-2">
					<Label htmlFor="apiKey">Api Key</Label>
					<Input id="apiKey" placeholder="" {...form.register("apiKey")} />
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="address">Address</Label>
				<div className="flex gap-2">
					<Input
						id="address"
						placeholder="http://192.168.0.123"
						className="flex-1"
						{...form.register("address", {
							required: "Address is required",
							minLength: {
								value: 8,
								message: "You must insert an address (with http://)",
							},
						})}
					/>
					<Button
						type="button"
						variant="default"
						size="icon"
						onClick={connect}
						disabled={testPrinterMutation.loading}
					>
						<IconPlugConnected className="h-4 w-4" stroke={1.5} />
					</Button>
				</div>
				{form.formState.errors.address && (
					<p className="text-sm text-destructive">
						{form.formState.errors.address.message}
					</p>
				)}
			</div>

			{form.watch("version") && (
				<>
					<div className="space-y-2">
						<Label htmlFor="status">Status</Label>
						<Input id="status" disabled {...form.register("status")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="version">Version</Label>
						<Input id="version" disabled {...form.register("version")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="state">State</Label>
						<Input id="state" disabled {...form.register("state")} />
					</div>
				</>
			)}

			<div className="flex justify-end">
				<Button type="submit" disabled={savePrinterMutation.loading}>
					{savePrinterMutation.loading ? "Saving..." : "Save"}
				</Button>
			</div>
		</form>
	);
}
