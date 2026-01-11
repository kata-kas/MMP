import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
	title: "Components/UI/Separator",
	component: Separator,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Separator component for visual division of content.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		orientation: {
			control: "select",
			options: ["horizontal", "vertical"],
		},
		decorative: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
	render: () => (
		<div className="w-[350px]">
			<div className="space-y-1">
				<h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
				<p className="text-sm text-muted-foreground">
					An open-source UI component library.
				</p>
			</div>
			<Separator className="my-4" />
			<div className="flex h-5 items-center space-x-4 text-sm">
				<div>Blog</div>
				<Separator orientation="vertical" />
				<div>Docs</div>
				<Separator orientation="vertical" />
				<div>Source</div>
			</div>
		</div>
	),
};

export const Vertical: Story = {
	render: () => (
		<div className="flex h-20 items-center gap-4">
			<div>Left</div>
			<Separator orientation="vertical" />
			<div>Center</div>
			<Separator orientation="vertical" />
			<div>Right</div>
		</div>
	),
};

export const InText: Story = {
	render: () => (
		<div className="w-[350px] space-y-4">
			<div>
				<h4 className="text-sm font-medium">Section 1</h4>
				<p className="text-sm text-muted-foreground">
					Content for section 1 goes here.
				</p>
			</div>
			<Separator />
			<div>
				<h4 className="text-sm font-medium">Section 2</h4>
				<p className="text-sm text-muted-foreground">
					Content for section 2 goes here.
				</p>
			</div>
			<Separator />
			<div>
				<h4 className="text-sm font-medium">Section 3</h4>
				<p className="text-sm text-muted-foreground">
					Content for section 3 goes here.
				</p>
			</div>
		</div>
	),
};

export const InNavigation: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<a href="#" className="text-sm font-medium">
				Home
			</a>
			<Separator orientation="vertical" className="h-4" />
			<a href="#" className="text-sm font-medium">
				About
			</a>
			<Separator orientation="vertical" className="h-4" />
			<a href="#" className="text-sm font-medium">
				Contact
			</a>
		</div>
	),
};
