import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
	title: "Components/UI/Textarea",
	component: Textarea,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Textarea component for multi-line text input.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		disabled: {
			control: "boolean",
		},
		rows: {
			control: "number",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
	render: () => (
		<div className="flex flex-col gap-2 w-[350px]">
			<Label htmlFor="textarea-default">Message</Label>
			<Textarea id="textarea-default" placeholder="Enter your message..." />
		</div>
	),
};

export const WithValue: Story = {
	render: () => (
		<div className="flex flex-col gap-2 w-[350px]">
			<Label htmlFor="textarea-value">Message</Label>
			<Textarea
				id="textarea-value"
				defaultValue="This is a pre-filled textarea with some content."
			/>
		</div>
	),
};

export const Disabled: Story = {
	render: () => (
		<div className="flex flex-col gap-2 w-[350px]">
			<Label htmlFor="textarea-disabled">Disabled</Label>
			<Textarea
				id="textarea-disabled"
				disabled
				placeholder="This textarea is disabled"
			/>
		</div>
	),
};

export const CustomRows: Story = {
	render: () => (
		<div className="flex flex-col gap-4 w-[350px]">
			<div className="flex flex-col gap-2">
				<Label htmlFor="textarea-small">Small (3 rows)</Label>
				<Textarea id="textarea-small" rows={3} placeholder="Small textarea" />
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="textarea-large">Large (10 rows)</Label>
				<Textarea id="textarea-large" rows={10} placeholder="Large textarea" />
			</div>
		</div>
	),
};
