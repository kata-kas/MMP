import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/components/theme-provider';
import { BrowserRouter } from 'react-router-dom';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" attribute="class">
          <div className="p-4">
            <Story />
          </div>
        </ThemeProvider>
      </BrowserRouter>
    ),
  ],
};

export default preview;
