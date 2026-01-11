import type { Meta, StoryObj } from '@storybook/react';
import { SelectBtn } from '@/assets/components/parts/select-btn/SelectBtn';
import { Icon3dRotate, IconStar } from '@tabler/icons-react';

const meta: Meta<typeof SelectBtn> = {
  title: 'Features/SelectBtn',
  component: SelectBtn,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SelectBtn>;

export const Unselected: Story = {
  args: {
    selected: false,
    onChange: () => {},
    icon: <Icon3dRotate />,
  },
};

export const Selected: Story = {
  args: {
    selected: true,
    onChange: () => {},
    icon: <Icon3dRotate />,
  },
};

export const CustomIcon: Story = {
  args: {
    selected: false,
    onChange: () => {},
    icon: <IconStar />,
  },
};

export const DefaultIcon: Story = {
  args: {
    selected: false,
    onChange: () => {},
  },
};

export const Interactive: Story = {
  args: {
    selected: false,
    onChange: () => {},
    icon: <Icon3dRotate />,
  },
};
