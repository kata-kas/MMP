import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Switch } from './switch';
import { Label } from './label';

const meta: Meta<typeof Switch> = {
  title: 'Components/UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Switch component built with Radix UI.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="switch-default" />
      <Label htmlFor="switch-default">Enable notifications</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="switch-checked" defaultChecked />
      <Label htmlFor="switch-checked">Enabled by default</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="switch-disabled" disabled />
        <Label htmlFor="switch-disabled">Disabled off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-disabled-checked" disabled defaultChecked />
        <Label htmlFor="switch-disabled-checked">Disabled on</Label>
      </div>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="switch-1" />
        <Label htmlFor="switch-1">Email notifications</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-2" defaultChecked />
        <Label htmlFor="switch-2">Push notifications</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-3" />
        <Label htmlFor="switch-3">SMS notifications</Label>
      </div>
    </div>
  ),
};

export const InteractionTest: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="switch-interaction" />
      <Label htmlFor="switch-interaction">Toggle me</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switchElement = canvas.getByRole('switch');
    await expect(switchElement).not.toBeChecked();
    await userEvent.click(switchElement);
    await expect(switchElement).toBeChecked();
    await userEvent.click(switchElement);
    await expect(switchElement).not.toBeChecked();
  },
};
