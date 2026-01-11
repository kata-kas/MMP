import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@/core/breadcrumbs/Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
	title: "Features/Breadcrumbs",
	component: Breadcrumbs,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const BreadcrumbsWithPath = ({ path }: { path: string }) => {
	const navigate = useNavigate();
	useEffect(() => {
		navigate(path);
	}, [navigate, path]);
	return <Breadcrumbs />;
};

export const Root: Story = {
	render: () => <BreadcrumbsWithPath path="/" />,
};

export const SingleLevel: Story = {
	render: () => <BreadcrumbsWithPath path="/projects" />,
};

export const TwoLevels: Story = {
	render: () => <BreadcrumbsWithPath path="/projects/new" />,
};

export const ThreeLevels: Story = {
	render: () => <BreadcrumbsWithPath path="/projects/project-1/assets" />,
};

export const DeepPath: Story = {
	render: () => (
		<BreadcrumbsWithPath path="/projects/project-1/assets/asset-1/details" />
	),
};

export const Settings: Story = {
	render: () => <BreadcrumbsWithPath path="/settings" />,
};

export const Printers: Story = {
	render: () => <BreadcrumbsWithPath path="/printers" />,
};

export const TempFiles: Story = {
	render: () => <BreadcrumbsWithPath path="/tempfiles" />,
};
