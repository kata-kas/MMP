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

interface BreadcrumbItemData {
	routeTo: string;
	isLast: boolean;
	displayName: string;
}

export function Breadcrumbs() {
	const location = useLocation();

	const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
		const segments = location.pathname.split("/").filter((x) => x);
		return segments.map((name, index) => {
			const routeTo = `/${segments.slice(0, index + 1).join("/")}`;
			const isLast = index === segments.length - 1;
			const displayName = breadcrumbMap[name] || name;
			return { routeTo, isLast, displayName };
		});
	}, [location.pathname]);

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbItems.length === 0 ? (
					<BreadcrumbItem>
						<BreadcrumbPage>Dashboard</BreadcrumbPage>
					</BreadcrumbItem>
				) : (
					<>
						<BreadcrumbItem className="hidden md:block">
							<BreadcrumbLink asChild>
								<Link to="/">Dashboard</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						{breadcrumbItems.map(({ routeTo, isLast, displayName }) => (
							<div key={routeTo} className="flex items-center">
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									{isLast ? (
										<BreadcrumbPage>{displayName}</BreadcrumbPage>
									) : (
										<BreadcrumbLink asChild>
											<Link to={routeTo}>{displayName}</Link>
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
							</div>
						))}
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
