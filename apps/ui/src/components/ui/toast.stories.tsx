import type { Meta, StoryObj } from '@storybook/react';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { Button } from './button';
import { useState } from 'react';

const meta = {
  title: 'Components/UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast notification component for displaying temporary messages.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

const DefaultComponent = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Toast</Button>
      <ToastProvider>
        <Toast open={open} onOpenChange={setOpen}>
          <ToastTitle>Scheduled: Catch up</ToastTitle>
          <ToastDescription>Friday, February 10, 2023 at 5:57 PM</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </>
  );
};

export const Default: Story = {
  render: () => <DefaultComponent />,
};

const WithActionComponent = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Toast</Button>
      <ToastProvider>
        <Toast open={open} onOpenChange={setOpen}>
          <ToastTitle>Uh oh! Something went wrong.</ToastTitle>
          <ToastDescription>There was a problem with your request.</ToastDescription>
          <ToastAction altText="Try again">Try again</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </>
  );
};

export const WithAction: Story = {
  render: () => <WithActionComponent />,
};

const DestructiveComponent = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Destructive Toast</Button>
      <ToastProvider>
        <Toast variant="destructive" open={open} onOpenChange={setOpen}>
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>Your session has expired. Please log in again.</ToastDescription>
          <ToastAction altText="Log in">Log in</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </>
  );
};

export const Destructive: Story = {
  render: () => <DestructiveComponent />,
};

const SimpleComponent = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Simple Toast</Button>
      <ToastProvider>
        <Toast open={open} onOpenChange={setOpen}>
          <ToastTitle>Event created</ToastTitle>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </>
  );
};

export const Simple: Story = {
  render: () => <SimpleComponent />,
};

const MultipleComponent = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; open: boolean }>>([]);
  const addToast = () => {
    const id = Date.now();
    setToasts([...toasts, { id, open: true }]);
  };
  return (
    <>
      <Button onClick={addToast}>Add Toast</Button>
      <ToastProvider>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            open={toast.open}
            onOpenChange={(open) => {
              setToasts(toasts.map((t) => (t.id === toast.id ? { ...t, open } : t)));
            }}
          >
            <ToastTitle>Toast {toast.id}</ToastTitle>
            <ToastDescription>This is toast number {toast.id}</ToastDescription>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </>
  );
};

export const Multiple: Story = {
  render: () => <MultipleComponent />,
};
