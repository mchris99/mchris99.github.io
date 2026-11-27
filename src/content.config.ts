import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Tags must be lowercase words joined by dashes, e.g. "python" or "database-design".
const tag = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'Tags must be lowercase with dashes instead of spaces, e.g. "database-design"',
  });

const projects = defineCollection({
  // Every .md file under src/content/projects becomes a project.
  // A folder like projects/my-project/index.md becomes /projects/my-project.
  loader: glob({
    base: './src/content/projects',
    pattern: ['**/*.md', '!**/_*/**', '!**/_*.md'],
    generateId: ({ entry }) =>
      entry.replace(/\\/g, '/').replace(/\/index\.md$/i, '').replace(/\.md$/i, '').toLowerCase(),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      category: z.string(),
      parent: z.string().nullish(),
      tags: z.array(tag).default([]),
      // "finished", "done" and "completed" all count as complete; "in progress" works with or without the dash.
      status: z.preprocess(
        (v) => {
          if (typeof v !== 'string') return v;
          const s = v.trim().toLowerCase().replace(/\s+/g, '-');
          if (['finished', 'done', 'completed'].includes(s)) return 'complete';
          if (['wip', 'active', 'started', 'ongoing'].includes(s)) return 'in-progress';
          return s;
        },
        z.enum(['idea', 'in-progress', 'complete']),
      ).default('in-progress'),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      cover: image().nullish(),
      github: z.url().nullish(),
      demo: z.url().nullish(),
    }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content', pattern: 'about.md' }),
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string().nullish(),
    email: z.string(),
    github: z.url().nullish(),
    linkedin: z.url().nullish(),
    resume: z.string().nullish(),
    skills: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, pages };
