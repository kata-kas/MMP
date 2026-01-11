import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '@/core/header/Header';
import { Tag } from '@/projects/entities/Project';

const mockTags: Tag[] = [
  { value: '3D Printing' },
  { value: 'PLA' },
  { value: 'Functional' },
  { value: 'Prototype' },
  { value: 'Custom' },
  { value: 'Design' },
  { value: 'Engineering' },
  { value: 'Manufacturing' },
  { value: 'Rapid Prototyping' },
  { value: 'CAD' },
  { value: 'STL' },
  { value: 'Model' },
];

const meta: Meta<typeof Header> = {
  title: 'Features/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: 'Project Title',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Project Title',
    description: 'This is a detailed description of the project. It can contain <strong>HTML</strong> and multiple lines of text.',
  },
};

export const WithImage: Story = {
  args: {
    title: 'Project Title',
    description: 'Project with custom background image',
    imagePath: 'https://images.unsplash.com/photo-1563520239648-a24e51d4b570?q=80&w=2000&h=400&auto=format&fit=crop',
  },
};

export const WithTags: Story = {
  args: {
    title: 'Project Title',
    description: 'Project with tags',
    tags: mockTags.slice(0, 5),
  },
};

export const WithManyTags: Story = {
  args: {
    title: 'Project Title',
    description: 'Project with many tags (shows +N indicator)',
    tags: mockTags,
  },
};

export const WithLink: Story = {
  args: {
    title: 'Project Title',
    description: 'Project with external link',
    link: 'https://example.com',
  },
};

export const Complete: Story = {
  args: {
    title: 'My Awesome Project',
    description: 'A comprehensive project description with <em>formatting</em> and <strong>emphasis</strong>.',
    imagePath: 'https://images.unsplash.com/photo-1563520239648-a24e51d4b570?q=80&w=2000&h=400&auto=format&fit=crop',
    tags: mockTags.slice(0, 8),
    link: 'https://example.com',
  },
};

export const Loading: Story = {
  args: {
    title: 'Project Title',
    description: 'Loading state',
    loading: true,
  },
};

export const Minimal: Story = {
  args: {
    title: 'Minimal Header',
  },
};

export const Mobile: Story = {
  args: {
    title: 'Project Title',
    description: 'Mobile viewport test',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {
    title: 'Project Title',
    description: 'Tablet viewport test',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
