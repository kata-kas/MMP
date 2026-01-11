import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'Components/UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input component with default, error, and disabled states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[350px]">
      <Label htmlFor="input-default">Label</Label>
      <Input id="input-default" placeholder="Enter text..." />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[350px]">
      <Label htmlFor="input-error">Email</Label>
      <Input
        id="input-error"
        type="email"
        placeholder="email@example.com"
        className="border-destructive focus-visible:ring-destructive"
      />
      <p className="text-sm text-destructive">Please enter a valid email address.</p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit this',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[350px]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-default-state">Default</Label>
        <Input id="input-default-state" placeholder="Default input" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-error-state">Error</Label>
        <Input
          id="input-error-state"
          placeholder="Error input"
          className="border-destructive focus-visible:ring-destructive"
        />
        <p className="text-sm text-destructive">Error message here.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-disabled-state">Disabled</Label>
        <Input id="input-disabled-state" disabled placeholder="Disabled input" />
      </div>
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[350px]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-text">Text</Label>
        <Input id="input-text" type="text" placeholder="Text input" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-email">Email</Label>
        <Input id="input-email" type="email" placeholder="email@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-password">Password</Label>
        <Input id="input-password" type="password" placeholder="Password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-number">Number</Label>
        <Input id="input-number" type="number" placeholder="123" />
      </div>
    </div>
  ),
};
