import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
	title: "Components/UI/Badge",
	component: Badge,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Badge component with multiple variants.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "secondary", "destructive", "outline"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
	args: {
		children: "Badge",
	},
};

export const Variants: Story = {
	render: () => (
		<div className="flex gap-2">
			<Badge variant="default">Default</Badge>
			<Badge variant="secondary">Secondary</Badge>
			<Badge variant="destructive">Destructive</Badge>
			<Badge variant="outline">Outline</Badge>
		</div>
	),
};

export const WithText: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 items-center">
				<Badge variant="default">New</Badge>
				<Badge variant="secondary">Updated</Badge>
				<Badge variant="destructive">Error</Badge>
				<Badge variant="outline">Draft</Badge>
			</div>
		</div>
	),
};
