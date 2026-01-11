import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
	title: "Components/UI/Avatar",
	component: Avatar,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Avatar component with image and fallback support.",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Avatar>
			<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
			<AvatarFallback>CN</AvatarFallback>
		</Avatar>
	),
};

export const WithFallback: Story = {
	render: () => (
		<Avatar>
			<AvatarImage src="https://invalid-url.com/image.png" alt="User" />
			<AvatarFallback>JD</AvatarFallback>
		</Avatar>
	),
};

export const FallbackOnly: Story = {
	render: () => (
		<Avatar>
			<AvatarFallback>AB</AvatarFallback>
		</Avatar>
	),
};

export const Sizes: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<Avatar className="h-8 w-8">
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback className="text-xs">SM</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>MD</AvatarFallback>
			</Avatar>
			<Avatar className="h-16 w-16">
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback className="text-lg">LG</AvatarFallback>
			</Avatar>
		</div>
	),
};

export const Multiple: Story = {
	render: () => (
		<div className="flex -space-x-2">
			<Avatar>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>CN</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
				<AvatarFallback>VC</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarFallback>+3</AvatarFallback>
			</Avatar>
		</div>
	),
};
