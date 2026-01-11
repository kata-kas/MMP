import type { Meta, StoryObj } from '@storybook/react';
import { AppSidebar } from '@/components/app-sidebar';
import { SettingsProvider } from '@/core/settings/settingsProvider';
import { SidebarProvider } from '@/components/ui/sidebar';

const meta: Meta<typeof AppSidebar> = {
  title: 'Features/AppSidebar',
  component: AppSidebar,
  decorators: [
    (Story) => (
      <SettingsProvider loading={<div>Loading...</div>}>
        <SidebarProvider>
          <div className="flex h-screen">
            <Story />
          </div>
        </SidebarProvider>
      </SettingsProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

export const Default: Story = {
  args: {},
};

export const Collapsed: Story = {
  args: {},
  decorators: [
    (Story) => (
      <SidebarProvider defaultOpen={false}>
        <Story />
      </SidebarProvider>
    ),
  ],
};
