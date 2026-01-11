import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
	title: "Components/UI/Popover",
	component: Popover,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Popover component for displaying floating content.",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Open popover</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Dimensions</h4>
						<p className="text-sm text-muted-foreground">
							Set the dimensions for the layer.
						</p>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="width">Width</Label>
							<Input
								id="width"
								defaultValue="100%"
								className="col-span-2 h-8"
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="maxWidth">Max. width</Label>
							<Input
								id="maxWidth"
								defaultValue="300px"
								className="col-span-2 h-8"
							/>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	),
};

export const Simple: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Click me</Button>
			</PopoverTrigger>
			<PopoverContent>
				<p className="text-sm">
					This is a simple popover with some text content.
				</p>
			</PopoverContent>
		</Popover>
	),
};

export const WithForm: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Edit Profile</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Edit Profile</h4>
						<p className="text-sm text-muted-foreground">
							Update your profile information.
						</p>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" placeholder="John Doe" />
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" placeholder="john@example.com" />
						<Button className="mt-2">Save changes</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	),
};

export const InteractionTest: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Open popover</Button>
			</PopoverTrigger>
			<PopoverContent>
				<p className="text-sm">Popover content</p>
			</PopoverContent>
		</Popover>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole("button");
		await userEvent.click(trigger);
		await expect(canvas.getByText("Popover content")).toBeInTheDocument();
	},
};
