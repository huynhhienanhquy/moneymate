import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: { autodocs: 'tag' },
  viteFinal: async (viteConfig) => {
    viteConfig.resolve = viteConfig.resolve || {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias || {}),
      '@': path.resolve(configDirectory, '../src'),
    };
    return viteConfig;
  },
};

export default config;
