import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/layouts/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: { autodocs: 'tag' },
  /**
   * Vite final for .storybook.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param viteConfig - The vite config value required by the operation.
   * @returns A promise containing the resulting .storybook value.
   */
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
