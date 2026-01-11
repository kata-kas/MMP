import type { Meta, StoryObj } from '@storybook/react';
import { DropDownMenu } from '@/assets/components/parts/drop-down-menu/DropDownMenu';
import { SetAsMain } from '@/assets/components/parts/set-as-main/SetAsMain';

const meta: Meta<typeof DropDownMenu> = {
  title: 'Features/DropDownMenu',
  component: DropDownMenu,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="flex justify-center items-center min-h-[200px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DropDownMenu>;

export const Default: Story = {
  args: {
    id: 'asset-1',
    projectUuid: 'project-1',
    onDelete: () => {},
    openDetails: () => {},
    downloadURL: '/api/projects/project-1/assets/asset-1/file?download=true',
  },
};

export const WithChildren: Story = {
  args: {
    id: 'asset-1',
    projectUuid: 'project-1',
    onDelete: () => {},
    openDetails: () => {},
    downloadURL: '/api/projects/project-1/assets/asset-1/file?download=true',
    children: <SetAsMain projectUuid="project-1" assetId="img-1" onChange={() => {}} />,
  },
};

export const WithoutDownload: Story = {
  args: {
    id: 'asset-1',
    projectUuid: 'project-1',
    onDelete: () => {},
    openDetails: () => {},
  },
};

export const WithoutDelete: Story = {
  args: {
    id: 'asset-1',
    projectUuid: 'project-1',
    openDetails: () => {},
    downloadURL: '/api/projects/project-1/assets/asset-1/file?download=true',
  },
};

export const Minimal: Story = {
  args: {
    id: 'asset-1',
    projectUuid: 'project-1',
  },
};
