import { X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TagsInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"value" | "onChange"
	> {
	value?: string[];
	onChange?: (value: string[]) => void;
	data?: string[];
	splitChars?: string[];
	clearable?: boolean;
	label?: string;
	maxDropdownHeight?: number;
}

const TagsInput = React.forwardRef<HTMLInputElement, TagsInputProps>(
	(
		{
			className,
			value = [],
			onChange,
			data = [],
			splitChars = [","],
			clearable,
			label,
			maxDropdownHeight = 200,
			placeholder,
			...props
		},
		ref,
	) => {
		const [inputValue, setInputValue] = React.useState("");
		const [open, setOpen] = React.useState(false);
		const inputRef = React.useRef<HTMLInputElement>(null);

		const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && inputValue.trim()) {
				e.preventDefault();
				const newValue = inputValue.trim();
				if (!value.includes(newValue)) {
					onChange?.(value ? [...value, newValue] : [newValue]);
				}
				setInputValue("");
			} else if (e.key === "Backspace" && !inputValue && value.length > 0) {
				onChange?.(value.slice(0, -1));
			} else if (splitChars.includes(e.key) && inputValue.trim()) {
				e.preventDefault();
				const newValue = inputValue.trim();
				if (!value.includes(newValue)) {
					onChange?.(value ? [...value, newValue] : [newValue]);
				}
				setInputValue("");
			}
		};

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			setInputValue(val);
			if (val && data.length > 0) {
				setOpen(true);
			}
		};

		const removeTag = (tagToRemove: string) => {
			onChange?.(value.filter((tag) => tag !== tagToRemove));
		};

		const addTag = (tag: string) => {
			if (!value.includes(tag)) {
				onChange?.(value ? [...value, tag] : [tag]);
			}
			setInputValue("");
			setOpen(false);
		};

		const filteredData = React.useMemo(() => {
			if (!inputValue) return data;
			return data.filter(
				(item) =>
					item.toLowerCase().includes(inputValue.toLowerCase()) &&
					!value.includes(item),
			);
		}, [data, inputValue, value]);

		return (
			<div className={cn("space-y-2", className)}>
				{label && <Label>{label}</Label>}
				<div className="flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
					{value.map((tag) => (
						<Badge key={tag} variant="secondary" className="gap-1">
							{tag}
							<button
								type="button"
								onClick={() => removeTag(tag)}
								className="ml-1 rounded-full hover:bg-secondary-foreground/20"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Input
								ref={ref || inputRef}
								type="text"
								value={inputValue}
								onChange={handleInputChange}
								onKeyDown={handleInputKeyDown}
								placeholder={placeholder}
								className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
								{...props}
							/>
						</PopoverTrigger>
						{data.length > 0 && filteredData.length > 0 && (
							<PopoverContent
								className="w-[--radix-popover-trigger-width] p-0"
								align="start"
							>
								<Command>
									<CommandInput
										value={inputValue}
										onValueChange={setInputValue}
									/>
									<CommandList style={{ maxHeight: `${maxDropdownHeight}px` }}>
										<CommandEmpty>No tags found.</CommandEmpty>
										<CommandGroup>
											{filteredData.map((item) => (
												<CommandItem
													key={item}
													onSelect={() => addTag(item)}
													className="cursor-pointer"
												>
													{item}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						)}
					</Popover>
				</div>
				{clearable && value.length > 0 && (
					<button
						type="button"
						onClick={() => onChange?.([])}
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						Clear all
					</button>
				)}
			</div>
		);
	},
);
TagsInput.displayName = "TagsInput";

export { TagsInput };
