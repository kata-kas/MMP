import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/ui/tags-input";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Tag } from "@/assets/entities/Assets";

export type AssetFilter = {
	name: string;
	tags: string[];
};

type AssetFilterProps = {
	value: AssetFilter;
	onChange: (f: AssetFilter) => void;
};

export function AssetFilter({ value, onChange }: AssetFilterProps) {
	const [filter, setFilter] = useState<AssetFilter>(value);
	const [opened, setOpened] = useState(false);
	const { data, loading } = useApiQuery<Tag[]>({
		url: "/tags",
	});

	const tags = useMemo(() => {
		return data?.map((t) => t.value) ?? [];
	}, [data]);

	useEffect(() => {
		setFilter(value);
		if (value && (value.name !== "" || value.tags.length > 0)) {
			setOpened(true);
		}
	}, [value]);

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setOpened(!opened)}
				disabled={loading}
			>
				{!opened ? (
					<IconFilter className="h-5 w-5" />
				) : (
					<IconX className="h-5 w-5" />
				)}
			</Button>
			<div
				className={`flex items-center gap-2 transition-all ${opened ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 w-0 overflow-hidden"}`}
			>
				<Input
					placeholder="Name"
					value={filter.name}
					onChange={(e) =>
						setFilter((f) => {
							return { ...f, name: e.target.value };
						})
					}
					className="w-[200px]"
				/>
				<TagsInput
					placeholder="Tags"
					data={tags}
					maxDropdownHeight={200}
					value={filter.tags}
					onChange={(v) => setFilter((f) => ({ ...f, tags: v }))}
					splitChars={[",", " ", "|"]}
					clearable
					className="w-[200px]"
				/>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => onChange(filter)}
					disabled={loading}
				>
					<IconSearch className="h-5 w-5" />
				</Button>
			</div>
		</div>
	);
}
