import {
	IconBrandMantine,
	type IconHome2,
	IconMoon,
	IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { menuItems as dashboardMenuItems } from "@/dashboard/menu";
import { cn } from "@/lib/utils";
import { menuItems as printersMenuItems } from "@/printers/menu";
import { menuItems as projectMenuItems } from "@/projects/menu";
import { menuItems as settingsMenuItems } from "@/settings/menu";
import { menuItems as tempFileMenuItems } from "@/tempfiles/menu";
import { SettingsContext } from "../settings/settingsContext";
import { StatusIcon } from "../sse/components/status-icon/StatusIcon";

interface NavbarLinkProps {
	icon: typeof IconHome2;
	label: string;
	href: string;
}

function NavbarLink({ icon: Icon, label, href }: NavbarLinkProps) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-[50px] w-[50px] rounded-md text-white hover:bg-blue-700"
						asChild
					>
						<NavLink
							to={href}
							className={({ isActive }) =>
								cn(
									"flex items-center justify-center",
									isActive &&
										"bg-white text-blue-600 shadow-sm hover:bg-white hover:text-blue-600",
								)
							}
						>
							<Icon stroke={1.5} />
						</NavLink>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right">
					<p>{label}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

const stdMenuItems = [
	...projectMenuItems,
	...tempFileMenuItems,
	...printersMenuItems,
];

const operationalItems = [...settingsMenuItems];

export function NavBar() {
	const { theme, setTheme } = useTheme();
	const { settings } = useContext(SettingsContext);
	const [menuItems, setMenuItems] = useState(stdMenuItems);

	useEffect(() => {
		if (settings.experimental.dashboard) {
			setMenuItems([...dashboardMenuItems, ...stdMenuItems]);
		} else {
			setMenuItems(stdMenuItems);
		}
	}, [settings.experimental]);

	const featureLinks = menuItems.map((link) => (
		<NavbarLink {...link} key={link.label} />
	));

	const opsLinks = operationalItems.map((link) => (
		<NavbarLink {...link} key={link.label} />
	));

	return (
		<nav className="flex h-full w-[80px] flex-col bg-blue-600 p-4">
			<div className="flex items-center justify-center">
				<IconBrandMantine type="mark" size={30} className="text-white" />
			</div>

			<div className="mt-12 flex-1">
				<div className="flex flex-col items-center justify-center gap-0">
					{featureLinks}
				</div>
			</div>

			<div className="flex flex-col items-center justify-center gap-0">
				{opsLinks}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-[50px] w-[50px] rounded-md text-white hover:bg-blue-700"
								onClick={() => setTheme(theme === "light" ? "dark" : "light")}
							>
								{theme === "dark" && <IconSun stroke={1.5} />}
								{theme === "light" && <IconMoon stroke={1.5} />}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">
							<p>Toggle color scheme</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				{settings.experimental.dashboard && (
					<StatusIcon className="h-[50px] w-[50px] rounded-md text-white hover:bg-blue-700" />
				)}
			</div>
		</nav>
	);
}
