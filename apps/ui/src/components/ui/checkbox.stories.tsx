import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
	title: "Components/UI/Checkbox",
	component: Checkbox,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Checkbox component built with Radix UI.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		checked: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="checkbox-default" />
			<Label htmlFor="checkbox-default">Accept terms and conditions</Label>
		</div>
	),
};

export const Checked: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="checkbox-checked" defaultChecked />
			<Label htmlFor="checkbox-checked">Checked by default</Label>
		</div>
	),
};

export const Disabled: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Checkbox id="checkbox-disabled" disabled />
				<Label htmlFor="checkbox-disabled">Disabled unchecked</Label>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox id="checkbox-disabled-checked" disabled defaultChecked />
				<Label htmlFor="checkbox-disabled-checked">Disabled checked</Label>
			</div>
		</div>
	),
};

export const Multiple: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Checkbox id="checkbox-1" />
				<Label htmlFor="checkbox-1">Option 1</Label>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox id="checkbox-2" defaultChecked />
				<Label htmlFor="checkbox-2">Option 2</Label>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox id="checkbox-3" />
				<Label htmlFor="checkbox-3">Option 3</Label>
			</div>
		</div>
	),
};
