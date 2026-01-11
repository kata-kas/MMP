import { Menu } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppShellProps {
	header?: ReactNode;
	navbar?: ReactNode;
	children: ReactNode;
	aside?: ReactNode;
	withBorder?: boolean;
	padding?: string;
	headerHeight?: number;
	navbarWidth?: number;
	asideWidth?: number;
}

export function AppShell({
	header,
	navbar,
	children,
	aside,
	withBorder = false,
	padding = "md",
	headerHeight = 60,
	navbarWidth = 80,
	asideWidth = 300,
}: AppShellProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const isDesktop = useMediaQuery({ minWidth: 900 });

	const paddingClasses = {
		xs: "p-1",
		sm: "p-2",
		md: "p-4",
		lg: "p-6",
		xl: "p-8",
	};

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			{header && (
				<header
					className={cn(
						"flex h-[60px] items-center border-b bg-background",
						withBorder && "border-border",
						paddingClasses[padding as keyof typeof paddingClasses] || "p-4",
					)}
					style={{ height: `${headerHeight}px` }}
				>
					{!isDesktop && (
						<Button
							variant="ghost"
							size="icon"
							className="mr-2"
							onClick={() => setMobileMenuOpen(true)}
						>
							<Menu className="h-5 w-5" />
						</Button>
					)}
					{header}
				</header>
			)}

			<div className="flex flex-1 overflow-hidden">
				{navbar &&
					(isDesktop ? (
						<aside
							className={cn(
								"border-r bg-background",
								withBorder && "border-border",
							)}
							style={{ width: `${navbarWidth}px` }}
						>
							{navbar}
						</aside>
					) : (
						<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
							<SheetContent side="left" className="w-[80px] p-0">
								{navbar}
							</SheetContent>
						</Sheet>
					))}

				<main
					className={cn(
						"flex-1 overflow-auto",
						paddingClasses[padding as keyof typeof paddingClasses] || "p-4",
					)}
				>
					{children}
				</main>

				{aside && (
					<aside
						className={cn(
							"border-l bg-background",
							withBorder && "border-border",
						)}
						style={{ width: `${asideWidth}px` }}
					>
						{aside}
					</aside>
				)}
			</div>
		</div>
	);
}
