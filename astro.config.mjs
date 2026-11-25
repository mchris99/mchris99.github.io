import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mchris99.github.io',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
