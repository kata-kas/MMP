import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './scroll-area';

const meta = {
  title: 'Components/UI/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Scrollable area component with custom scrollbar styling.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div className="space-y-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="text-sm">
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <ScrollArea className="h-[300px] w-[400px] rounded-md border p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Scrollable Content</h3>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-medium">Section {i + 1}</p>
            <p className="text-sm text-muted-foreground">
              This is some content for section {i + 1}. It demonstrates how the scroll area
              handles long content that extends beyond the visible area.
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-[350px] whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex h-32 w-32 shrink-0 items-center justify-center rounded-md border">
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const WithList: Story = {
  render: () => (
    <ScrollArea className="h-[250px] w-[300px] rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="text-sm">
            <div className="mb-2 rounded-md border p-2">
              Tag {i + 1}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
