/**
 * Chelsea Filter Simulator
 * Show expected color reactions under Chelsea filter
 */

import { useState } from 'react';

interface ChelseaReaction {
  gem: string;
  natural: string;
  synthetic: string;
  notes: string;
  category: string;
}

const REACTIONS: ChelseaReaction[] = [
  {
    gem: 'Emerald (Natural Colombian)',
    natural: 'Strong red/pink',
    synthetic: 'Strong red/pink',
    notes: 'Chrome-coloured emeralds fluoresce',
    category: 'emerald',
  },
  {
    gem: 'Emerald (Natural Zambian)',
    natural: 'Weak/None',
    synthetic: 'Weak/None',
    notes: 'Iron-rich, less chromium',
    category: 'emerald',
  },
  {
    gem: 'Emerald (Synthetic)',
    natural: 'N/A',
    synthetic: 'Very strong red',
    notes: 'Often brighter than natural',
    category: 'emerald',
  },
  {
    gem: 'Ruby (Natural)',
    natural: 'Strong red (brighter)',
    synthetic: 'Very strong red',
    notes: 'Chromium fluorescence',
    category: 'corundum',
  },
  {
    gem: 'Sapphire (Blue)',
    natural: 'Remains blue',
    synthetic: 'Remains blue',
    notes: 'No chromium, no reaction',
    category: 'corundum',
  },
  {
    gem: 'Synthetic Blue Spinel',
    natural: 'N/A',
    synthetic: 'Red',
    notes: 'Cobalt-coloured shows red',
    category: 'synthetic',
  },
  {
    gem: 'Synthetic Green Glass',
    natural: 'N/A',
    synthetic: 'Brown/Red',
    notes: 'Chromium in glass',
    category: 'synthetic',
  },
  {
    gem: 'Alexandrite',
    natural: 'Red (enhanced)',
    synthetic: 'Very strong red',
    notes: 'Strong chromium content',
    category: 'chrysoberyl',
  },
  {
    gem: 'Jadeite (Natural)',
    natural: 'Remains green',
    synthetic: 'Weak pink (if dyed)',
    notes: 'Dyed jadeite may show pink',
    category: 'jade',
  },
  {
    gem: 'Peridot',
    natural: 'Remains green',
    synthetic: 'Remains green',
    notes: 'Iron-coloured, no reaction',
    category: 'other',
  },
  {
    gem: 'Diamond',
    natural: 'Remains white/colourless',
    synthetic: 'Remains white/colourless',
    notes: 'No reaction expected',
    category: 'other',
  },
];

export function ChelseaFilter() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = REACTIONS.filter(r => {
    const matchSearch = !search || r.gem.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600 dark:text-cream-secondary">
          The Chelsea filter transmits deep red and yellow-green light, filtering out other wavelengths. Chromium-bearing gems fluoresce red.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-2">
            Search Gem
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400"
            placeholder="e.g., emerald, ruby"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-2">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400"
          >
            <option value="all">All</option>
            <option value="emerald">Emerald</option>
            <option value="corundum">Corundum</option>
            <option value="chrysoberyl">Chrysoberyl</option>
            <option value="jade">Jade</option>
            <option value="synthetic">Synthetics</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((reaction, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-slate-200 dark:border-coffee-border bg-white dark:bg-coffee-raised">
            <h5 className="font-semibold text-slate-900 dark:text-cream-primary mb-3">{reaction.gem}</h5>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {reaction.natural !== 'N/A' && (
                <div className="bg-green-50 dark:bg-emerald-400/10 border border-green-200 dark:border-emerald-400/20 rounded p-3">
                  <div className="text-xs text-green-600 dark:text-emerald-300 font-medium mb-1">Natural</div>
                  <div className="font-semibold text-green-900 dark:text-emerald-200">{reaction.natural}</div>
                </div>
              )}
              {reaction.synthetic !== 'N/A' && (
                <div className="bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded p-3">
                  <div className="text-xs text-red-600 dark:text-red-300 font-medium mb-1">Synthetic/Treated</div>
                  <div className="font-semibold text-red-900 dark:text-red-200">{reaction.synthetic}</div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-cream-muted mt-3 italic">{reaction.notes}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-600 dark:text-cream-secondary">
          No gems match your search.
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">Important Limitations</h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <li>• <strong>Not definitive:</strong> Chelsea filter alone cannot prove natural vs synthetic</li>
          <li>• <strong>Origin matters:</strong> Different emerald sources react differently</li>
          <li>• <strong>Lighting critical:</strong> Use strong light source for best results</li>
          <li>• <strong>Combine tests:</strong> Always use with other identification methods</li>
        </ul>
      </div>

      <div className="bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">How It Works</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          The Chelsea filter is a didymium glass filter that transmits deep red (around 690nm) and yellow-green (around 570nm) light. Gems containing chromium fluoresce under the filter, appearing red or pink. This is especially useful for screening emeralds and detecting some synthetic stones.
        </p>
      </div>

      <div className="text-sm text-slate-600 dark:text-cream-secondary">
        <a
          href="/learn/equipment/other-tools"
          className="text-crystal-700 dark:text-crystal-400 hover:text-crystal-700 dark:hover:text-crystal-300 underline"
        >
          Learn more about the Chelsea filter and its limitations <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
