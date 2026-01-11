import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { TagsInput } from './tags-input';
import { useState } from 'react';

const meta = {
  title: 'Components/UI/TagsInput',
  component: TagsInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tags input component for managing multiple tags.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'object',
    },
    clearable: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const DefaultComponent = () => {
  const [tags, setTags] = useState<string[]>([]);
  return <TagsInput value={tags} onChange={setTags} placeholder="Add tags..." />;
};

export const Default: Story = {
  render: () => <DefaultComponent />,
};

const WithInitialTagsComponent = () => {
  const [tags, setTags] = useState<string[]>(['react', 'typescript', 'storybook']);
  return <TagsInput value={tags} onChange={setTags} placeholder="Add tags..." />;
};

export const WithInitialTags: Story = {
  render: () => <WithInitialTagsComponent />,
};

const WithDataComponent = () => {
  const [tags, setTags] = useState<string[]>([]);
  const data = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'remix', 'astro'];
  return (
    <TagsInput
      value={tags}
      onChange={setTags}
      data={data}
      placeholder="Type to search..."
    />
  );
};

export const WithData: Story = {
  render: () => <WithDataComponent />,
};

const WithLabelComponent = () => {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <TagsInput
      value={tags}
      onChange={setTags}
      label="Technologies"
      placeholder="Add technologies..."
    />
  );
};

export const WithLabel: Story = {
  render: () => <WithLabelComponent />,
};

const ClearableComponent = () => {
  const [tags, setTags] = useState<string[]>(['react', 'typescript', 'storybook']);
  return (
    <TagsInput
      value={tags}
      onChange={setTags}
      clearable
      placeholder="Add tags..."
    />
  );
};

export const Clearable: Story = {
  render: () => <ClearableComponent />,
};

const WithCustomSplitCharsComponent = () => {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <TagsInput
      value={tags}
      onChange={setTags}
      splitChars={[',', ';', ' ']}
      placeholder="Separate tags with comma, semicolon, or space"
    />
  );
};

export const WithCustomSplitChars: Story = {
  render: () => <WithCustomSplitCharsComponent />,
};

const InteractionTestComponent = () => {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="w-[400px]">
      <TagsInput value={tags} onChange={setTags} placeholder="Type and press Enter..." />
    </div>
  );
};

export const InteractionTest: Story = {
  render: () => <InteractionTestComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/type and press enter/i);
    await userEvent.type(input, 'react{Enter}');
    await expect(canvas.getByText('react')).toBeInTheDocument();
  },
};
