import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

// Each category is a "layer", colored like the layers in laser-cutting software.
const CATEGORY_COLORS: Record<string, string> = {
  'software & databases': '#2b59f5',
  'laser-cut designs': '#e5302a',
  'data & analytics': '#0f8f4a',
  'robotics & coaching': '#8a2be2',
  'teaching & curriculum': '#d9730d',
};
const FALLBACK = ['#0f8f4a', '#d9730d', '#8a2be2', '#0090c8', '#c2186b', '#6b7a00'];

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] ?? FALLBACK[hash(category.toLowerCase()) % FALLBACK.length];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) => !data.draft);
  const ids = new Set(all.map((p) => p.id));
  for (const p of all) {
    if (p.data.parent && !ids.has(p.data.parent.toLowerCase())) {
      throw new Error(
        `Project "${p.data.title}" has parent "${p.data.parent}", but no project folder has that name. ` +
          `Use the parent's folder name, e.g. "my-tool-library".`,
      );
    }
  }
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export interface TreeNode {
  project: Project;
  children: TreeNode[];
}
export interface CategoryBranch {
  name: string;
  slug: string;
  color: string;
  count: number;
  nodes: TreeNode[];
}

export function buildTree(projects: Project[]): CategoryBranch[] {
  const nodes = new Map<string, TreeNode>();
  for (const p of projects) nodes.set(p.id, { project: p, children: [] });
  const roots: TreeNode[] = [];
  for (const p of projects) {
    const node = nodes.get(p.id)!;
    const parentId = p.data.parent?.toLowerCase();
    if (parentId && nodes.has(parentId)) nodes.get(parentId)!.children.push(node);
    else roots.push(node);
  }
  const countAll = (n: TreeNode): number => 1 + n.children.reduce((s, c) => s + countAll(c), 0);
  const byCat = new Map<string, TreeNode[]>();
  for (const r of roots) {
    const c = r.project.data.category;
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c)!.push(r);
  }
  return [...byCat.entries()]
    .map(([name, list]) => ({
      name,
      slug: slugify(name),
      color: categoryColor(name),
      count: list.reduce((s, n) => s + countAll(n), 0),
      nodes: list.sort((a, b) => a.project.data.title.localeCompare(b.project.data.title)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function tagCounts(projects: Project[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const p of projects) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export const STATUS_LABEL: Record<string, string> = {
  idea: 'Idea',
  'in-progress': 'In progress',
  complete: 'Complete',
};

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
