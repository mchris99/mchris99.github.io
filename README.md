# mchris99.github.io

Chris McHenry's personal site: https://mchris99.github.io

Built with [Astro](https://astro.build), with search from [Pagefind](https://pagefind.app). Every push to `main` rebuilds the site and publishes it to GitHub Pages in about two minutes.

## Writing in Obsidian

Open the `src/content` folder as its own Obsidian vault (Open folder as vault). The settings in `src/content/.obsidian` already do the following:

- Save pasted images in the same folder as the note you're writing.
- Use standard Markdown links instead of `[[wikilinks]]`.
- Look for templates in `_templates`. Turn on the **Templates** core plugin once (Settings → Core plugins).

To publish from Obsidian, install the **Git** community plugin and run "Commit and sync" after you save. You can also use GitHub Desktop.

```
src/content/
├─ about.md                    ← home page text and contact links
├─ projects/
│  └─ my-tool-library/
│     ├─ index.md              ← the project write-up
│     └─ cover.jpg             ← optional photo
└─ _templates/New Project.md
```

## Adding a project

1. Create a folder in `projects/` named the way the web address should read, e.g. `milwaukee-house-flips`. That becomes `/projects/milwaukee-house-flips/`.
2. Inside it, create `index.md` and insert the **New Project** template.
3. Fill in the front matter and write the project in Markdown.
4. Commit and push. The site updates on its own.

| Field | Required | What it does |
|---|---|---|
| `title` | yes | Project name |
| `summary` | yes | One line, shown in lists and search results |
| `date` | yes | `YYYY-MM-DD`; newest projects are listed first |
| `category` | yes | Branch of the project tree, e.g. `Software & Databases`. A new name creates a new branch. |
| `parent` | no | Folder name of another project, to nest this one under it in the tree |
| `tags` | no | Lowercase with dashes, e.g. `[python, database-design]` |
| `status` | no | `idea`, `in-progress` (default) or `complete` (`finished` and `done` also work) |
| `featured` | no | `true` puts it on the home page |
| `draft` | no | `true` hides it from the site |
| `cover` | no | Photo file in the same folder, e.g. `./cover.jpg` |
| `github`, `demo` | no | Full links; they show up as buttons |

If a field is wrong (a tag with a capital letter, a date in the wrong format, a parent that doesn't exist), the build stops and the live site stays as it was. The failed run on the repo's **Actions** tab says which file and field to fix.

The repo is public, so keep unfinished drafts in your main vault until they're ready, or use `draft: true` and remember the text is still visible on GitHub.

## Updating other things

- **Resume:** replace `public/resume.pdf` and push.
- **Bio, headline, skills, links:** edit `src/content/about.md`. Add a LinkedIn URL there to show a LinkedIn button.

## Running it on your computer (optional)

```
npm install
npm run dev
```

Search only works after `npm run build`; while running `npm run dev`, the project tree filters on titles, summaries and tags only.
