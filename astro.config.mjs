import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://mchris99.github.io',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeFigures],
  },
});
