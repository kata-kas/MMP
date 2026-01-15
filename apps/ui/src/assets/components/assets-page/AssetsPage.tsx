import { Outlet, useParams } from "react-router-dom";
import { AssetsTree } from "@/assets/components/assets-tree/AssetsTree";
import { Button } from "@/components/ui/button";
import { EdgeToggleButton } from "@/components/ui/edge-toggle-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { openSearchDialog } from "@/core/search/searchDialogStore";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function AssetsPage() {
	return (
		<div className="flex h-full min-h-0 w-full overflow-hidden bg-background">
			<AssetsLeftPane />
			<div className="min-h-0 min-w-0 flex-1">
				<Outlet />
			</div>
		</div>
	);
}

function AssetsLeftPane() {
	const { id } = useParams<{ id?: string }>();
	const [open, setOpen] = useState(true);

	useEffect(() => {
		const stored = localStorage.getItem("assets_tree_pane_open");
		if (stored === "0") setOpen(false);
	}, []);

	useEffect(() => {
		localStorage.setItem("assets_tree_pane_open", open ? "1" : "0");
	}, [open]);

	return (
		<div className="relative z-20 min-h-0 h-full shrink-0 overflow-visible">
			<div
				className="h-full overflow-hidden transition-[width] duration-200 ease-linear"
				style={{ width: open ? 320 : 0 }}
			>
				<div className="flex min-h-0 h-full w-[320px] flex-col border-r bg-muted/20">
					<div className="flex items-center gap-2 border-b px-2 py-2">
						<div className="text-sm font-medium">Assets</div>
						<Button
							variant="ghost"
							size="icon"
							className="ml-auto h-8 w-8"
							onClick={openSearchDialog}
							title="Search assets (Cmd/Ctrl+K)"
						>
							<Search className="h-4 w-4" />
						</Button>
					</div>
					<ScrollArea className="min-h-0 flex-1">
						<div className="p-2">
							<AssetsTree selectedAssetId={id} />
						</div>
					</ScrollArea>
				</div>
			</div>

			<EdgeToggleButton
				collapsed={!open}
				side="left"
				onClick={() => setOpen((v) => !v)}
				className="absolute right-0 top-1/2 z-40 -translate-y-1/2 translate-x-1/2"
			/>
		</div>
	);
}
