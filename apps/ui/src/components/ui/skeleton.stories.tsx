import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./skeleton";

const meta: Meta<typeof Skeleton> = {
	title: "Components/UI/Skeleton",
	component: Skeleton,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Skeleton component for loading states.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
	render: () => <Skeleton className="h-4 w-[250px]" />,
};

export const Text: Story = {
	render: () => (
		<div className="flex flex-col gap-2 w-[350px]">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/2" />
		</div>
	),
};

export const Avatar: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<Skeleton className="h-12 w-12 rounded-full" />
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-[200px]" />
				<Skeleton className="h-4 w-[150px]" />
			</div>
		</div>
	),
};

export const Card: Story = {
	render: () => (
		<div className="flex flex-col gap-4 w-[350px]">
			<Skeleton className="h-[200px] w-full rounded-lg" />
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	),
};

export const Button: Story = {
	render: () => (
		<div className="flex gap-2">
			<Skeleton className="h-10 w-24" />
			<Skeleton className="h-10 w-24" />
		</div>
	),
};

export const Table: Story = {
	render: () => (
		<div className="flex flex-col gap-2 w-[500px]">
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
		</div>
	),
};
