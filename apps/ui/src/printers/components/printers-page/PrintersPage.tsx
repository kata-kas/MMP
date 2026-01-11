import {
	IconDots,
	IconPhoto,
	IconReportAnalytics,
	IconSettings,
	IconTrash,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/core/header/Header";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import { logger } from "@/lib/logger";
import { type Printer, printerTypes } from "@/printers/entities/Printer";
import { AddPrinter } from "./parts/add-printer/AddPrinter";

export function PrintersPage() {
	const { data } = useApiQuery<Printer[]>({
		url: "/printers",
	});

	const deletePrinterMutation = useApiMutation<void, { uuid: string }>({
		url: (vars) => `/printers/${vars.uuid}/delete`,
		method: "post",
	});

	const printers = data ?? [];

	function deletePrinter(i: number): void {
		const printer = printers[i];
		if (!printer) {
			return;
		}
		deletePrinterMutation
			.mutate({ uuid: printer.uuid })
			.then(() => {
				toast.success("Great Success!", {
					description: "Printer deleted!",
				});
			})
			.catch((e) => {
				logger.error(e);
			});
	}

	return (
		<>
			<Header
				imagePath={
					"https://images.unsplash.com/photo-1611117775350-ac3950990985?q=80&w=2000&h=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				}
			/>
			<Tabs defaultValue="list">
				<TabsList>
					<TabsTrigger value="list">
						<IconPhoto className="mr-2 h-3 w-3" />
						Printers
					</TabsTrigger>
					<TabsTrigger value="new">
						<IconSettings className="mr-2 h-3 w-3" />
						New
					</TabsTrigger>
				</TabsList>
				<TabsContent value="list">
					<ScrollArea className="w-full">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>State</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Version</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{printers?.map((printer, i) => (
									<TableRow key={printer.uuid}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={
															(
																printerTypes.get(printer.type) as
																	| { logo?: string }
																	| undefined
															)?.logo ?? undefined
														}
													/>
													<AvatarFallback>{printer.name[0]}</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-sm font-medium">{printer.name}</p>
													<a
														href={printer.address}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-muted-foreground hover:underline"
													>
														{printer.address}
													</a>
												</div>
											</div>
										</TableCell>
										<TableCell>{printer.state}</TableCell>
										<TableCell>
											<Badge
												variant={
													printer.status === "connected"
														? "default"
														: "destructive"
												}
											>
												{printer.status}
											</Badge>
										</TableCell>
										<TableCell>
											<p className="text-sm">{printer.version}</p>
										</TableCell>
										<TableCell>
											<div className="flex justify-end">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															disabled={deletePrinterMutation.loading}
														>
															<IconDots className="h-4 w-4" stroke={1.5} />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link to={`/printers/${printer.uuid}`}>
																<IconReportAnalytics
																	className="mr-2 h-4 w-4"
																	stroke={1.5}
																/>
																Edit
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => deletePrinter(i)}
															className="text-destructive"
														>
															<IconTrash
																className="mr-2 h-4 w-4"
																stroke={1.5}
															/>
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="new">
					<AddPrinter />
				</TabsContent>
			</Tabs>
		</>
	);
}
