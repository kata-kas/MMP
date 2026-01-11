import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Project } from "@/projects/entities/Project";

type ProjectSelectProps = {
	boosted: string[];
	projects: Project[];
	value: string;
	onChange: (p: Project) => void;
	loading: boolean;
};

export function ProjectSelect({
	boosted,
	projects,
	value,
	onChange,
	loading,
}: ProjectSelectProps) {
	const [open, setOpen] = useState(false);
	const [sValue, setSValue] = useState("");
	const [options, setOptions] = useState<Project[]>([]);

	useEffect(() => {
		if (!value && projects && boosted.length === 1) {
			const p = projects.find((p) => p.uuid === boosted[0]);
			if (p) {
				setSValue(p.name);
				onChange(p);
			}
		}
	}, [projects, boosted, value, onChange]);

	useEffect(() => {
		if (!projects || value === sValue) return;
		const p = projects.find((p) => p.name === sValue);
		if (p) {
			onChange(p);
		}
	}, [sValue, projects, value, onChange]);

	useEffect(() => {
		if (loading || !projects) return;
		const shouldFilterOptions = !projects.some((item) => item.name === sValue);

		const filteredOptions = shouldFilterOptions
			? projects.filter((item) =>
					item.name.toLowerCase().includes(sValue.toLowerCase().trim()),
				)
			: projects;

		setOptions(
			filteredOptions.sort((p1, p2) => {
				if (boosted.includes(p1.uuid)) return -9;
				return p1.name.localeCompare(p2.name);
			}),
		);
	}, [loading, projects, sValue, boosted]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={loading}
				>
					{sValue || "Select project..."}
					{loading ? (
						<Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
					) : (
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput
						placeholder="Search project..."
						value={sValue}
						onValueChange={setSValue}
					/>
					<CommandList>
						<CommandEmpty>Nothing found...</CommandEmpty>
						<CommandGroup>
							{options.map((p) => (
								<CommandItem
									key={p.uuid}
									value={p.name}
									onSelect={() => {
										setSValue(p.name);
										onChange(p);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											sValue.includes(p.name) ? "opacity-100" : "opacity-0",
										)}
									/>
									{p.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
