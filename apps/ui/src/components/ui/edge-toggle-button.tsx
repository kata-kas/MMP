import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

type EdgeToggleButtonProps = React.ComponentProps<"button"> & {
	side?: "left" | "right";
	collapsed: boolean;
};

export function EdgeToggleButton({
	side = "left",
	collapsed,
	className,
	...props
}: EdgeToggleButtonProps) {
	const Icon =
		side === "left"
			? collapsed
				? ChevronRight
				: ChevronLeft
			: collapsed
				? ChevronLeft
				: ChevronRight;

	return (
		<button
			type="button"
			aria-label={collapsed ? "Expand" : "Collapse"}
			title={collapsed ? "Expand" : "Collapse"}
			className={cn(
				"flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
				className,
			)}
			{...props}
		>
			<Icon className="h-4 w-4" />
		</button>
	);
}

