import { useState, useCallback } from 'react';
import { CrystalCard } from '../crystal/CrystalCard';
import { MineralModal } from './MineralModal';
import type { Mineral } from '../../lib/db';

interface GalleryGridProps {
  minerals: Mineral[];
  loading?: boolean;
}

export function GalleryGrid({ minerals, loading }: GalleryGridProps) {
  const [selectedMineral, setSelectedMineral] = useState<Mineral | null>(null);

  const handleCardClick = useCallback((mineral: Mineral) => {
    setSelectedMineral(mineral);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMineral(null);
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="aspect-square skeleton" />
            <div className="p-4 space-y-2">
              <div className="h-5 skeleton rounded w-3/4" />
              <div className="h-4 skeleton rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (minerals.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900">No minerals found</h3>
        <p className="mt-2 text-slate-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '').replace(/\//g, '-');

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {minerals.map((mineral) => {
          const slug = generateSlug(mineral.name);
          return (
            <CrystalCard
              key={mineral.id}
              name={mineral.name}
              system={mineral.system}
              svgContent={mineral.model_svg || undefined}
              svgPath={mineral.model_svg ? undefined : `/crystals/${slug}.svg`}
              chemistry={mineral.chemistry}
              hardness={mineral.hardness}
              href={`/minerals/${slug}`}
              onClick={() => handleCardClick(mineral)}
            />
          );
        })}
      </div>

      {selectedMineral && (
        <MineralModal
          mineral={selectedMineral}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
