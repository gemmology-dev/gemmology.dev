/**
 * ToolAndLearnLinks — renders a step's optional "Learn more" and "Try the
 * tool" links (learnLinks -> /learn/[slug], toolLinks -> arbitrary href).
 */

import { Link } from '../ui/Link';

interface ToolAndLearnLinksProps {
  learnLinks?: string[];
  toolLinks?: Array<{ href: string; label: string }>;
}

export function ToolAndLearnLinks({ learnLinks = [], toolLinks = [] }: ToolAndLearnLinksProps) {
  if (learnLinks.length === 0 && toolLinks.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {learnLinks.map((slug) => (
        <Link key={slug} href={`/learn/${slug}`} withArrow>
          Learn more: {slug.replace(/-/g, ' ')}
        </Link>
      ))}
      {toolLinks.map((tool) => (
        <Link key={tool.href} href={tool.href} withArrow>
          {tool.label}
        </Link>
      ))}
    </div>
  );
}
