# Gemmology.dev Website - Missing Features & Optimizations

**Status**: Partially Complete (Frontend Shell Ready, Backend Integration Missing)
**Priority**: High (blocks public launch)
**Date**: January 2026

---

## Executive Summary

The gemmology.dev website is a **well-designed Astro/React application** with professional UI/UX. However, it is **NOT PRODUCTION-READY** due to missing backend integration, stub implementations, and incomplete content.

**What Works**:
- Gallery with 50+ mineral presets (sql.js database)
- Landing page with professional design
- CDL playground editor with syntax highlighting
- Responsive design & deployment pipeline

**What's Missing**:
- Backend API integration (CDL parsing, geometry, rendering)
- 3D WebGL viewer
- 14 documentation/learn pages
- Export functionality
- Automated tests

---

## Critical Missing Features

### 1. Backend API Integration

**Status**: No backend exists

**Current State**:
- CDL validation uses regex patterns only
- Preview shows placeholder SVG octahedron
- Export buttons show "would trigger here" alerts

**Required Endpoints**:

| Endpoint | Purpose | Backend Package |
|----------|---------|-----------------|
| `POST /api/parse` | Parse CDL string | cdl-parser |
| `POST /api/geometry` | Generate 3D geometry | crystal-geometry |
| `POST /api/render/svg` | Render to SVG | crystal-renderer |
| `POST /api/render/stl` | Export to STL | crystal-renderer |
| `POST /api/render/gltf` | Export to glTF | crystal-renderer |
| `GET /api/presets` | List mineral presets | mineral-database |
| `GET /api/presets/:id` | Get preset details | mineral-database |

**Implementation Options**:

1. **Cloudflare Workers + Python (via HTTP)**
   ```
   Frontend → Cloudflare Worker → Python API (Railway/Fly.io)
   ```

2. **Pyodide/WASM (client-side)**
   ```
   Frontend → Pyodide → cdl-parser/crystal-geometry (in browser)
   ```

3. **Pre-generated Static Assets**
   ```
   Build time → Generate all preset SVGs/geometries → Static hosting
   ```

**Recommended**: Option 1 for dynamic CDL, Option 3 for presets.

---

### 2. 3D WebGL Viewer

**Status**: Not implemented

**Current State**:
- Uses 2D SVG with CSS 3D transforms
- `transform: perspective(800px) rotateX(...) rotateY(...)`
- No actual 3D geometry rendering

**Proposed Implementation**:

```typescript
// src/components/crystal/Crystal3DViewer.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';

interface Crystal3DViewerProps {
  geometry: {
    vertices: number[][];
    faces: number[][];
    faceColors?: string[];
  };
}

export function Crystal3DViewer({ geometry }: Crystal3DViewerProps) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <Stage environment="studio" intensity={0.5}>
        <CrystalMesh geometry={geometry} />
      </Stage>
      <OrbitControls enableZoom={true} enablePan={false} />
    </Canvas>
  );
}

function CrystalMesh({ geometry }) {
  const { vertices, faces, faceColors } = geometry;
  // Convert to Three.js BufferGeometry
  // Apply per-face colors
  // Return mesh with proper materials
}
```

**Dependencies to Add**:
```json
{
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.92.0",
  "three": "^0.160.0"
}
```

---

### 3. Missing Documentation Pages (8 pages)

**Status**: Links exist, content missing

| Page | Route | Priority |
|------|-------|----------|
| Installation | `/docs/installation` | High |
| Quick Start | `/docs/quickstart` | High |
| CDL Specification | `/docs/cdl` | High |
| CLI Reference | `/docs/cli` | Medium |
| API Reference | `/docs/api` | Medium |
| Configuration | `/docs/config` | Low |
| Troubleshooting | `/docs/troubleshooting` | Medium |
| Contributing | `/docs/contributing` | Low |

**Proposed Structure** (`src/pages/docs/`):
```
docs/
├── index.astro          # Hub (exists)
├── installation.astro   # Getting started
├── quickstart.astro     # First crystal in 5 min
├── cdl/
│   ├── index.astro      # CDL overview
│   ├── syntax.astro     # Full syntax reference
│   ├── systems.astro    # Crystal systems
│   ├── forms.astro      # Named forms
│   └── modifications.astro
├── cli.astro            # Command reference
├── api.astro            # REST API docs
└── troubleshooting.astro
```

---

### 4. Missing Learn Pages (6 pages)

**Status**: Links exist, content missing

| Topic | Route | Content Source |
|-------|-------|----------------|
| Crystal Systems | `/learn/crystal-systems` | gemmology-knowledge |
| Physical Properties | `/learn/physical-properties` | gemmology-knowledge |
| Optical Properties | `/learn/optical-properties` | gemmology-knowledge |
| Inclusions | `/learn/inclusions` | gemmology-knowledge |
| Treatments | `/learn/treatments` | gemmology-knowledge |
| Synthetics | `/learn/synthetics` | gemmology-knowledge |

**Content Strategy**:
- Import markdown from `gemmology-knowledge` repository
- Use Astro content collections
- Add interactive elements (quizzes, diagrams)

---

### 5. Export Functionality

**Status**: Stub implementation

**Current** (`src/components/playground/ExportPanel.tsx`):
```typescript
const handleExport = (format: string) => {
  alert(`Export to ${format} would trigger here`);  // STUB
};
```

**Required Implementation**:

```typescript
// src/lib/export.ts
export async function exportCrystal(
  cdl: string,
  format: 'svg' | 'stl' | 'gltf' | 'gemcad'
): Promise<Blob> {
  const response = await fetch(`/api/render/${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cdl }),
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## High-Priority Improvements

### 6. Automated Testing

**Status**: Zero test coverage

**Proposed Test Structure**:
```
src/
├── __tests__/
│   ├── components/
│   │   ├── playground/
│   │   │   ├── CDLEditor.test.tsx
│   │   │   ├── CDLPreview.test.tsx
│   │   │   └── ExportPanel.test.tsx
│   │   ├── gallery/
│   │   │   ├── Gallery.test.tsx
│   │   │   └── FilterBar.test.tsx
│   │   └── ui/
│   │       ├── Button.test.tsx
│   │       └── Card.test.tsx
│   ├── hooks/
│   │   ├── useCDLValidation.test.ts
│   │   └── useCrystalDB.test.ts
│   └── lib/
│       ├── db.test.ts
│       └── monaco-cdl.test.ts
e2e/
├── playground.spec.ts
├── gallery.spec.ts
└── navigation.spec.ts
```

**Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

**Dependencies to Add**:
```json
{
  "vitest": "^1.2.0",
  "@testing-library/react": "^14.1.0",
  "@testing-library/user-event": "^14.5.0",
  "@playwright/test": "^1.41.0"
}
```

---

### 7. Real CDL Validation

**Status**: Regex-based only

**Current** (`src/hooks/useCDLValidation.ts`):
```typescript
// Simple regex validation
const systemPattern = /^(cubic|hexagonal|trigonal|...)/;
```

**Proposed**: Use cdl-parser via API or WASM

```typescript
// src/lib/cdl-validator.ts
export async function validateCDL(cdl: string): Promise<ValidationResult> {
  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cdl }),
    });

    const result = await response.json();

    if (result.error) {
      return {
        valid: false,
        error: result.error,
        position: result.position,
      };
    }

    return {
      valid: true,
      parsed: result.description,
    };
  } catch (error) {
    return { valid: false, error: 'Validation service unavailable' };
  }
}
```

---

### 8. Individual Mineral Pages

**Status**: Modal exists, dedicated pages missing

**Current**: `/gallery` shows modal on click
**Needed**: `/gallery/[mineral]` dedicated pages

**Proposed** (`src/pages/gallery/[mineral].astro`):
```astro
---
import { getMineral, getAllMinerals } from '../../lib/db';
import BaseLayout from '../../layouts/BaseLayout.astro';
import CrystalViewer from '../../components/crystal/CrystalViewer';
import FGAInfoPanel from '../../components/crystal/FGAInfoPanel';

export async function getStaticPaths() {
  const minerals = await getAllMinerals();
  return minerals.map(m => ({
    params: { mineral: m.id },
    props: { mineral: m },
  }));
}

const { mineral } = Astro.props;
---

<BaseLayout title={mineral.name}>
  <article class="max-w-4xl mx-auto py-12 px-4">
    <h1 class="text-4xl font-bold">{mineral.name}</h1>
    <p class="text-xl text-gray-600">{mineral.chemistry}</p>

    <div class="grid md:grid-cols-2 gap-8 mt-8">
      <CrystalViewer client:load cdl={mineral.cdl} />
      <FGAInfoPanel mineral={mineral} />
    </div>

    <section class="mt-12">
      <h2>CDL Definition</h2>
      <pre><code>{mineral.cdl}</code></pre>
    </section>
  </article>
</BaseLayout>
```

---

## Medium-Priority Improvements

### 9. SEO Enhancements

**Missing**:
- `robots.txt`
- `sitemap.xml`
- JSON-LD structured data
- Canonical URLs for dynamic pages

**Proposed** (`public/robots.txt`):
```
User-agent: *
Allow: /

Sitemap: https://gemmology.dev/sitemap.xml
```

**Sitemap Generation** (`astro.config.mjs`):
```javascript
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gemmology.dev',
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
});
```

**JSON-LD** (`src/layouts/BaseLayout.astro`):
```astro
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Gemmology.dev",
  "url": "https://gemmology.dev",
  "description": "Crystal visualization and gemstone expertise",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gemmology.dev/gallery?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

---

### 10. Accessibility Improvements

**Missing**:
- ARIA labels on interactive elements
- Skip navigation link
- Focus management in modals
- Screen reader announcements

**Proposed Fixes**:

```tsx
// Skip link
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Modal focus trap
import { FocusTrap } from '@headlessui/react';

// ARIA labels
<button aria-label="Export crystal as SVG">
  <DownloadIcon />
</button>

// Live regions
<div role="status" aria-live="polite">
  {isLoading ? 'Loading crystals...' : `${count} crystals found`}
</div>
```

---

### 11. Dark Mode Support

**Status**: Not implemented

**Proposed Implementation**:

```typescript
// src/hooks/useTheme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored || (system ? 'dark' : 'light'));
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return { theme, toggle };
}
```

**Tailwind Config**:
```javascript
module.exports = {
  darkMode: 'class',
  // ...
};
```

---

### 12. Performance Optimization

**Current Issues**:
- Monaco editor loaded on page load (large bundle)
- sql.js WASM loaded synchronously
- No image lazy loading

**Proposed Fixes**:

```tsx
// Lazy load Monaco
const CDLEditor = dynamic(() => import('./CDLEditor'), {
  loading: () => <div class="skeleton h-64" />,
  ssr: false,
});

// Lazy load sql.js
const db = await import('sql.js').then(m => m.default());

// Image lazy loading
<img loading="lazy" src={crystalSvg} alt={name} />
```

---

## Low-Priority Improvements

### 13. Internationalization (i18n)

**Not Started**

**Recommended Approach**:
- Use Astro i18n integration
- Priority languages: English, German, Japanese, Chinese

---

### 14. Community Gallery

**Not Started**

**Proposed Features**:
- User-submitted crystal designs
- OAuth login (GitHub, Google)
- Like/favorite system
- Share with URL

---

### 15. Mobile App

**Not Started**

**Options**:
- React Native with shared components
- PWA with offline support

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Backend API for CDL/render | 2 weeks | Core functionality |
| P0 | Connect playground to API | 1 week | Core functionality |
| P1 | Create documentation pages | 1 week | User adoption |
| P1 | Create learn pages | 1 week | FGA curriculum |
| P1 | Add Three.js 3D viewer | 2 weeks | Visual impact |
| P1 | Implement export endpoints | 1 week | Core functionality |
| P2 | Add automated tests | 1 week | Quality assurance |
| P2 | Individual mineral pages | 3 days | SEO/navigation |
| P2 | SEO enhancements | 2 days | Discoverability |
| P3 | Accessibility audit | 3 days | Compliance |
| P3 | Dark mode | 2 days | UX |
| P3 | Performance optimization | 3 days | Speed |

---

## Timeline to Production

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2-3 weeks | Documentation pages, learn pages, tests |
| Phase 2 | 3-4 weeks | Backend API, playground integration |
| Phase 3 | 4-6 weeks | Three.js 3D viewer, export functionality |
| Phase 4 | 2-3 weeks | Polish, SEO, accessibility, launch |

**Estimated Total**: 11-16 weeks to production-ready state

---

## Verification Checklist

Before launch:

- [ ] All 8 documentation pages complete
- [ ] All 6 learn pages complete
- [ ] Backend API deployed and functional
- [ ] Playground generates real SVG from CDL
- [ ] Export to SVG/STL/glTF works
- [ ] 3D WebGL viewer implemented
- [ ] Individual mineral pages exist
- [ ] Vitest test suite passes (80%+ coverage)
- [ ] E2E tests pass
- [ ] Lighthouse score > 90 (all categories)
- [ ] WCAG 2.1 AA compliance
- [ ] robots.txt and sitemap.xml present
- [ ] SSL certificate active
- [ ] Analytics configured

---

*Document created: 2026-01-20*
