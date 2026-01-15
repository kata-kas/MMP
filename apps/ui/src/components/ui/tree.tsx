import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ItemInstance } from "@headless-tree/core";
import { ChevronDownIcon, MinusSquare, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type ToggleIconType = "chevron" | "plus-minus";

type TreeContextValue = {
	indent: number;
	currentItem?: ItemInstance<any>;
	tree?: {
		getContainerProps?: () => React.HTMLAttributes<HTMLDivElement>;
		getDragLineStyle?: () => React.CSSProperties;
	};
	toggleIconType?: ToggleIconType;
};

const TreeContext = React.createContext<TreeContextValue>({
	indent: 20,
});

function useTreeContext() {
	return React.useContext(TreeContext);
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
	indent?: number;
	tree?: TreeContextValue["tree"];
	toggleIconType?: ToggleIconType;
};

function Tree({
	indent = 20,
	tree,
	className,
	toggleIconType = "chevron",
	...props
}: TreeProps) {
	const containerProps = tree?.getContainerProps?.() ?? {};
	const mergedProps = { ...containerProps, ...props };

	const { style: propStyle, ...otherProps } = mergedProps;
	const mergedStyle = {
		...propStyle,
		"--tree-indent": `${indent}px`,
	} as React.CSSProperties;

	return (
		<TreeContext.Provider value={{ indent, tree, toggleIconType }}>
			<div
				data-slot="tree"
				style={mergedStyle}
				className={cn("flex flex-col", className)}
				{...otherProps}
			/>
		</TreeContext.Provider>
	);
}

type TreeItemProps = React.HTMLAttributes<HTMLButtonElement> & {
	item: ItemInstance<any>;
	asChild?: boolean;
};

function TreeItem({
	item,
	className,
	asChild,
	children,
	...props
}: TreeItemProps) {
	const parentContext = useTreeContext();
	const { indent } = parentContext;

	const itemProps = (typeof item.getProps === "function" ? item.getProps() : {}) as
		| React.HTMLAttributes<HTMLButtonElement>
		| undefined;

	const mergedOnClick: React.MouseEventHandler<HTMLButtonElement> | undefined = (
		e,
	) => {
		itemProps?.onClick?.(e);
		if (e.defaultPrevented) return;
		props.onClick?.(e);
	};

	const mergedOnKeyDown: React.KeyboardEventHandler<HTMLButtonElement> | undefined =
		(e) => {
			itemProps?.onKeyDown?.(e);
			if (e.defaultPrevented) return;
			props.onKeyDown?.(e);
		};

	const mergedProps = { ...itemProps, ...props, onClick: mergedOnClick, onKeyDown: mergedOnKeyDown };
	const { style: propStyle, ...otherProps } = mergedProps;

	const mergedStyle = {
		...propStyle,
		"--tree-padding": `${item.getItemMeta().level * indent}px`,
	} as React.CSSProperties;

	const Comp = asChild ? Slot : "button";

	return (
		<TreeContext.Provider value={{ ...parentContext, currentItem: item }}>
			<Comp
				data-slot="tree-item"
				style={mergedStyle}
				className={cn(
					"group z-10 select-none pl-[var(--tree-padding)] pb-0.5 last:pb-0 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
					className,
				)}
				data-focus={typeof item.isFocused === "function" ? item.isFocused() || false : undefined}
				data-folder={typeof item.isFolder === "function" ? item.isFolder() || false : undefined}
				data-selected={typeof item.isSelected === "function" ? item.isSelected() || false : undefined}
				data-drag-target={
					typeof item.isDragTarget === "function" ? item.isDragTarget() || false : undefined
				}
				data-search-match={
					typeof item.isMatchingSearch === "function"
						? item.isMatchingSearch() || false
						: undefined
				}
				aria-expanded={item.isExpanded()}
				{...otherProps}
			>
				{children}
			</Comp>
		</TreeContext.Provider>
	);
}

type TreeItemLabelProps = React.HTMLAttributes<HTMLSpanElement> & {
	item?: ItemInstance<any>;
};

function TreeItemLabel({
	item: propItem,
	children,
	className,
	...props
}: TreeItemLabelProps) {
	const { currentItem, toggleIconType } = useTreeContext();
	const item = propItem || currentItem;

	if (!item) return null;

	const chevronRotation = item.isExpanded() ? "" : "-rotate-90";

	return (
		<span
			data-slot="tree-item-label"
			className={cn(
				"flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[selected=true]:bg-accent group-data-[selected=true]:text-accent-foreground group-data-[drag-target=true]:bg-accent group-data-[folder=false]:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{item.isFolder() &&
				(toggleIconType === "plus-minus" ? (
					item.isExpanded() ? (
						<MinusSquare className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1} />
					) : (
						<PlusSquare className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1} />
					)
				) : (
					<ChevronDownIcon className={cn("h-4 w-4 text-muted-foreground transition-transform", chevronRotation)} />
				))}
			{children || (typeof item.getItemName === "function" ? item.getItemName() : null)}
		</span>
	);
}

function TreeDragLine({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const { tree } = useTreeContext();
	const dragLine = tree?.getDragLineStyle?.();
	if (!dragLine) return null;

	return (
		<div
			style={dragLine}
			className={cn(
				"absolute z-30 -mt-px h-0.5 bg-primary before:absolute before:-top-[3px] before:left-0 before:h-2 before:w-2 before:rounded-full before:border-2 before:border-primary before:bg-background",
				className,
			)}
			{...props}
		/>
	);
}

export { Tree, TreeItem, TreeItemLabel, TreeDragLine };
