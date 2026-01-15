import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { breadcrumbMap } from "./breadcrumb-config";
import { useBreadcrumbs } from "./BreadcrumbContext";

interface BreadcrumbItemData {
	routeTo?: string;
	isLast: boolean;
	displayName: string;
}

export function Breadcrumbs() {
	const location = useLocation();
	const { items: customItems } = useBreadcrumbs();

	const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
		// If custom items are provided via context, use them
		if (customItems && customItems.length > 0) {
			return customItems.map((item, index) => ({
				displayName: item.label,
				routeTo: item.path,
				isLast: index === customItems.length - 1,
			}));
		}

		// Fallback to URL-based breadcrumbs
		const segments = location.pathname.split("/").filter((x) => x);
		return segments.map((name, index) => {
			const routeTo = `/${segments.slice(0, index + 1).join("/")}`;
			const isLast = index === segments.length - 1;
			const displayName = breadcrumbMap[name] || name;
			return { routeTo, isLast, displayName };
		});
	}, [location.pathname, customItems]);

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbItems.map(({ routeTo, isLast, displayName }, index) => {
					const showSeparator = index < breadcrumbItems.length - 1;

					return (
						<div key={routeTo || index} className="flex items-center">
							<BreadcrumbItem>
								{isLast || !routeTo ? (
									<BreadcrumbPage>{displayName}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link to={routeTo}>{displayName}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{showSeparator && (
								<BreadcrumbSeparator className="hidden md:block" />
							)}
						</div>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
