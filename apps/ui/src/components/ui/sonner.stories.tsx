import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './sonner';
import { Button } from './button';
import { toast } from 'sonner';

const meta = {
  title: 'Components/UI/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast notification component using Sonner.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    return (
      <>
        <Toaster />
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => {
              toast('Event has been created');
            }}
          >
            Show Toast
          </Button>
          <Button
            onClick={() => {
              toast.success('Profile updated successfully');
            }}
          >
            Success Toast
          </Button>
          <Button
            onClick={() => {
              toast.error('Something went wrong');
            }}
          >
            Error Toast
          </Button>
          <Button
            onClick={() => {
              toast.info('New message received');
            }}
          >
            Info Toast
          </Button>
          <Button
            onClick={() => {
              toast.warning('Please check your input');
            }}
          >
            Warning Toast
          </Button>
        </div>
      </>
    );
  },
};

export const WithDescription: Story = {
  render: () => {
    return (
      <>
        <Toaster />
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => {
              toast('Event has been created', {
                description: 'Monday, January 3rd at 6:00pm',
              });
            }}
          >
            Toast with Description
          </Button>
          <Button
            onClick={() => {
              toast.success('Profile updated', {
                description: 'Your profile has been updated successfully.',
              });
            }}
          >
            Success with Description
          </Button>
        </div>
      </>
    );
  },
};

export const WithAction: Story = {
  render: () => {
    return (
      <>
        <Toaster />
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => {
              toast('Event has been created', {
                action: {
                  label: 'Undo',
                  onClick: () => {},
                },
              });
            }}
          >
            Toast with Action
          </Button>
          <Button
            onClick={() => {
              toast.error('Failed to save', {
                action: {
                  label: 'Retry',
                  onClick: () => {},
                },
              });
            }}
          >
            Error with Action
          </Button>
        </div>
      </>
    );
  },
};

export const Promise: Story = {
  render: () => {
    return (
      <>
        <Toaster />
        <Button
          onClick={() => {
            const promise = () =>
              new Promise((resolve) => setTimeout(() => resolve({ name: 'Sonner' }), 2000));

            toast.promise(promise, {
              loading: 'Loading...',
              success: (data) => {
                return `${(data as { name: string }).name} toast has been added`;
              },
              error: 'Error',
            });
          }}
        >
          Promise Toast
        </Button>
      </>
    );
  },
};
