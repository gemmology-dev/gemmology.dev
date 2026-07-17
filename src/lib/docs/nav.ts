/**
 * Documentation navigation tree — single source of truth.
 *
 * This is the canonical list of every page under `/docs`, grouped the same
 * way `src/pages/docs/index.astro` groups its hub cards. Both the hub page
 * and `DocsSidebar.astro` render from `docsNav` directly rather than each
 * keeping their own copy, so adding/renaming/reordering a docs page only
 * requires editing this file.
 *
 * `docsFlatPages` flattens `docsNav` in reading order for prev/next
 * (`PageNav`) and breadcrumb lookups — see `getDocsPageNav` / `getDocsBreadcrumb`.
 */

export interface DocsNavItem {
  href: string;
  label: string;
  description: string;
}

export interface DocsNavGroup {
  /** Group heading shown in the sidebar and (for `showGroupCrumb` groups) as a breadcrumb segment. */
  title: string;
  items: DocsNavItem[];
  /**
   * When true, breadcrumbs for pages in this group include a middle
   * "Docs / {title} / {page}" segment linking back to `/docs`. Matches the
   * API Reference pages' pre-existing 3-level breadcrumb; every other group
   * historically used a flat "Docs / {page}" breadcrumb, so this defaults
   * to false to preserve that appearance exactly.
   */
  showGroupCrumb?: boolean;
}

export const docsNav: DocsNavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Overview', description: 'Documentation home' },
      { href: '/docs/installation', label: 'Installation', description: 'Install gemmology packages via pip' },
      { href: '/docs/quickstart', label: 'Quick Start', description: 'Generate your first crystal visualisation' },
    ],
  },
  {
    title: 'CDL Language',
    items: [
      { href: '/docs/cdl', label: 'CDL Specification', description: 'Complete Crystal Description Language reference' },
      { href: '/docs/cdl-examples', label: 'CDL Examples', description: 'Common patterns and recipes' },
    ],
  },
  {
    title: 'API Reference',
    showGroupCrumb: true,
    items: [
      { href: '/docs/api/cdl-parser', label: 'cdl-parser', description: 'Parse and validate CDL expressions' },
      { href: '/docs/api/crystal-geometry', label: 'crystal-geometry', description: '3D geometry generation' },
      { href: '/docs/api/mineral-database', label: 'mineral-database', description: 'Query mineral presets' },
      { href: '/docs/api/crystal-renderer', label: 'crystal-renderer', description: 'Render crystals to SVG, STL, glTF' },
    ],
  },
  {
    title: 'CLI Reference',
    items: [
      { href: '/docs/cli', label: 'Command Line', description: 'Generate crystals from the terminal' },
      { href: '/docs/cli-options', label: 'CLI Options', description: 'Complete list of command-line flags' },
    ],
  },
];

export interface FlatDocsPage extends DocsNavItem {
  group: string;
}

/** `docsNav` flattened in reading order — the order prev/next navigation follows. */
export const docsFlatPages: FlatDocsPage[] = docsNav.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.title }))
);

/** Strips a trailing slash (except the bare root) so `/docs/cdl` and `/docs/cdl/` compare equal. */
function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export function isDocsNavActive(href: string, pathname: string): boolean {
  return normalizePath(href) === normalizePath(pathname);
}

export interface DocsPageNavLink {
  label: string;
  href: string;
}

/** Looks up prev/next links for `pathname` from the flat reading order. Returns `{}` if the page isn't in the tree. */
export function getDocsPageNav(pathname: string): { prev?: DocsPageNavLink; next?: DocsPageNavLink } {
  const index = docsFlatPages.findIndex((page) => isDocsNavActive(page.href, pathname));
  if (index === -1) return {};

  const prevPage = index > 0 ? docsFlatPages[index - 1] : undefined;
  const nextPage = index < docsFlatPages.length - 1 ? docsFlatPages[index + 1] : undefined;

  return {
    prev: prevPage ? { label: prevPage.label, href: prevPage.href } : undefined,
    next: nextPage ? { label: nextPage.label, href: nextPage.href } : undefined,
  };
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail for `pathname`. Returns `null` for the docs root itself
 * (which has never shown a breadcrumb) or for paths outside the nav tree.
 */
export function getDocsBreadcrumb(pathname: string): BreadcrumbItem[] | null {
  if (isDocsNavActive('/docs', pathname)) return null;

  for (const group of docsNav) {
    const item = group.items.find((page) => isDocsNavActive(page.href, pathname));
    if (!item) continue;

    const trail: BreadcrumbItem[] = [{ label: 'Docs', href: '/docs' }];
    if (group.showGroupCrumb) {
      trail.push({ label: group.title, href: '/docs' });
    }
    trail.push({ label: item.label });
    return trail;
  }

  return null;
}
