/**
 * Protected Gallery - Wraps Gallery with LockGate
 */

import { LockGate } from './LockGate';
import { Gallery } from '../gallery/Gallery';
import { Container, SectionHeader } from '../ui';

interface ProtectedGalleryProps {
  initialSystem?: string;
  initialSearch?: string;
}

export function ProtectedGallery({ initialSystem = '', initialSearch = '' }: ProtectedGalleryProps) {
  return (
    <LockGate>
      <div className="bg-gradient-to-b from-crystal-50 to-white min-h-[80vh]">
        <Container size="xl" padding="md">
          <SectionHeader
            title="Crystal Gallery"
            description="Explore our collection of 50+ mineral presets with FGA-accurate crystallographic data. Click any crystal to view detailed properties and open in the playground."
          />
          <Gallery
            initialSystem={initialSystem}
            initialSearch={initialSearch}
          />
        </Container>
      </div>
    </LockGate>
  );
}
