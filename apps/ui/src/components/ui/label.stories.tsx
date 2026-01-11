import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Input } from './input';

const meta: Meta<typeof Label> = {
  title: 'Components/UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Label component for form inputs.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[350px]">
      <Label htmlFor="label-default">Label</Label>
      <Input id="label-default" placeholder="Input with label" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[350px]">
      <Label htmlFor="label-required">
        Required Field <span className="text-destructive">*</span>
      </Label>
      <Input id="label-required" placeholder="Required input" />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[350px]">
      <Label htmlFor="label-description">Email Address</Label>
      <Input id="label-description" type="email" placeholder="email@example.com" />
      <p className="text-sm text-muted-foreground">We'll never share your email.</p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[350px]">
      <Label htmlFor="label-disabled">Disabled Field</Label>
      <Input id="label-disabled" disabled placeholder="Disabled input" />
    </div>
  ),
};
