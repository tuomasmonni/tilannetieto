import nextConfig from 'eslint-config-next';

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ['.next/', 'node_modules/', 'vitest.config.ts'],
  },
];

export default eslintConfig;
