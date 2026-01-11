import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Toggle } from './toggle';
import { Bold, Italic, Underline } from 'lucide-react';

const meta = {
  title: 'Components/UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toggle button component for on/off states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    pressed: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Toggle aria-label="Toggle italic">Toggle</Toggle>,
};

export const WithIcon: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold className="h-4 w-4" />
    </Toggle>
  ),
};

export const Pressed: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic" pressed>
      <Italic className="h-4 w-4" />
    </Toggle>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Toggle default" variant="default">
        Default
      </Toggle>
      <Toggle aria-label="Toggle outline" variant="outline">
        Outline
      </Toggle>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Toggle small" size="sm">
        <Bold className="h-3 w-3" />
      </Toggle>
      <Toggle aria-label="Toggle default" size="default">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Toggle large" size="lg">
        <Bold className="h-5 w-5" />
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Toggle disabled" disabled>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Toggle disabled pressed" disabled pressed>
        <Italic className="h-4 w-4" />
      </Toggle>
    </div>
  ),
};

export const FormattingToolbar: Story = {
  render: () => (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Toggle aria-label="Toggle bold" size="sm">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Toggle italic" size="sm" pressed>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Toggle underline" size="sm">
        <Underline className="h-4 w-4" />
      </Toggle>
    </div>
  ),
};

export const InteractionTest: Story = {
  render: () => <Toggle aria-label="Toggle test">Click me</Toggle>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');
    await expect(toggle).not.toHaveAttribute('data-state', 'on');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('data-state', 'on');
  },
};
