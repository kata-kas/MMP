import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button } from "./button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./tooltip";

const meta = {
	title: "Components/UI/Tooltip",
	component: Tooltip,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Tooltip component for displaying additional information on hover.",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline">Hover me</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>This is a tooltip</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

export const WithText: Story = {
	render: () => (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline">Hover for info</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Add to library</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

export const Multiple: Story = {
	render: () => (
		<TooltipProvider>
			<div className="flex gap-4">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline">Button 1</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Tooltip for button 1</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline">Button 2</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Tooltip for button 2</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline">Button 3</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Tooltip for button 3</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	),
};

export const WithIcon: Story = {
	render: () => (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="ghost" size="icon">
						<span className="text-lg">ℹ️</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Click for more information</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

export const InteractionTest: Story = {
	render: () => (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline">Hover me</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Tooltip content</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button");
		await userEvent.hover(button);
		await expect(canvas.getByText("Tooltip content")).toBeInTheDocument();
	},
};
