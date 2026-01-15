import { IconBrandMantine, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
	Sidebar,
	SidebarContent,
	SidebarEdgeTrigger,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { menuItems as dashboardMenuItems } from "@/dashboard/menu";
import { menuItems as printersMenuItems } from "@/printers/menu";
import { menuItems as assetMenuItems } from "@/assets/menu";
import { menuItems as settingsMenuItems } from "@/settings/menu";
import { menuItems as tempFileMenuItems } from "@/tempfiles/menu";
import { SettingsContext } from "../core/settings/settingsContext";
import { StatusIcon } from "../core/sse/components/status-icon/StatusIcon";

const stdMenuItems = [
	...assetMenuItems,
	...tempFileMenuItems,
	...printersMenuItems,
];

const operationalItems = [...settingsMenuItems];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { theme, setTheme } = useTheme();
	const { settings } = useContext(SettingsContext);
	const [menuItems, setMenuItems] = useState(stdMenuItems);
	const location = useLocation();

	useEffect(() => {
		if (settings.experimental.dashboard) {
			setMenuItems([...dashboardMenuItems, ...stdMenuItems]);
		} else {
			setMenuItems(stdMenuItems);
		}
	}, [settings.experimental]);

	const getPath = (href: string) => {
		if (href === "/") return "/";
		return `/${href}`;
	};

	const isActive = (href: string) => {
		const path = getPath(href);
		if (path === "/") {
			return location.pathname === "/";
		}
		return (
			location.pathname === path || location.pathname.startsWith(`${path}/`)
		);
	};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center justify-center p-4 transition-[padding] duration-200 ease-linear group-data-[collapsible=icon]:p-2">
					<div className="origin-center transition-transform duration-200 ease-linear group-data-[collapsible=icon]:scale-90">
						<IconBrandMantine type="mark" size={30} />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				{menuItems.map((item) => (
					<SidebarGroup key={item.label}>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={isActive(item.href)}
										tooltip={item.label}
									>
										<NavLink to={getPath(item.href)}>
											<item.icon stroke={1.5} />
											<span>{item.label}</span>
										</NavLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						{operationalItems.map((item) => (
							<SidebarMenuItem key={item.label}>
								<SidebarMenuButton
									asChild
									isActive={isActive(item.href)}
									tooltip={item.label}
								>
									<NavLink to={getPath(item.href)}>
										<item.icon stroke={1.5} />
										<span>{item.label}</span>
									</NavLink>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
						<SidebarMenuItem>
							<SidebarMenuButton
								tooltip="Toggle theme"
								onClick={() => setTheme(theme === "light" ? "dark" : "light")}
							>
								{theme === "dark" && <IconSun stroke={1.5} />}
								{theme === "light" && <IconMoon stroke={1.5} />}
								<span>Toggle theme</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
						{settings.experimental.dashboard && (
							<SidebarMenuItem>
								<StatusIcon />
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarEdgeTrigger />
		</Sidebar>
	);
}
