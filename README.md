# gemmology.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Crystal structure visualization and gemmological reference for FGA students and professionals.

**Live site**: [https://gemmology.dev](https://gemmology.dev)

## Features

- **Crystal Gallery**: 50+ mineral presets with FGA-accurate crystallographic data
- **CDL Playground**: Interactive Crystal Description Language editor with live preview
- **Documentation**: Complete API reference, CLI documentation, and CDL specification
- **Learn**: FGA curriculum-aligned content on crystallography and gemmology
- **Quiz System**: Practice and exam modes with questions generated from 91 YAML learn files
- **Calculator Tools**: 8 gemmological calculators for SG, RI, birefringence, and more

## Tech Stack

- [Astro](https://astro.build/) - Static site generator
- [React](https://react.dev/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - CDL editor
- [sql.js](https://sql.js.org/) - SQLite in the browser

## Development

```bash
# Install dependencies
npm install

# Sync learn content from gemmology-knowledge at the pinned tag
npm run sync

# Copy database files
npm run copy-db

# Validate inline {cite:id} markers resolve and references parse
npm run validate:citations

# Start development server
npm run dev

# Build for production (auto-runs sync + copy-db)
npm run build

# Preview production build
npm run preview
```

`npm run sync` is also invoked automatically by `npm run dev` and `npm run build`; you only need to run it by hand after bumping the knowledge pin (see [Knowledge content & citations](#knowledge-content--citations)).

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base UI components (Button, Card, etc.)
│   ├── crystal/      # Crystal visualization components
│   ├── gallery/      # Gallery page components
│   ├── playground/   # CDL Playground components
│   ├── quiz/         # Quiz and exam components
│   ├── calculator/   # Gemmological calculator components
│   └── layout/       # Layout components (Header, Footer)
├── hooks/            # React hooks (useCrystalDB, useQuiz, useExam, etc.)
├── layouts/          # Astro layouts
├── lib/
│   ├── quiz/         # Quiz system (question generation, scoring)
│   ├── calculator/   # Calculation formulas and gem data
│   └── ...           # Other utilities (db.ts, monaco-cdl.ts)
├── pages/
│   ├── quiz/         # Quiz entry point
│   ├── tools/        # Calculator tools
│   └── ...           # Other pages
└── styles/           # Global CSS
```

## Deployment

The site is deployed to [Cloudflare Pages](https://pages.cloudflare.com/):

| Environment | URL |
|-------------|-----|
| Production | [gemmology.dev](https://gemmology.dev) |
| Pages subdomain | [gemmology-dev.pages.dev](https://gemmology-dev.pages.dev) |

Automatic deployments occur on push to `main`. Pull requests get preview deployments.

### Manual Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name=gemmology-dev
```

### Environment Variables

Required secrets in GitHub:
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages edit permission
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

## Interactive Learning Features

### Quiz System (`/quiz`)

Generate and take quizzes from the gemmology knowledge base:

- **Practice Mode**: Immediate feedback, explanations, and "learn more" links
- **Exam Mode**: Timed assessments with question flagging and detailed results
- **8 Categories**: Fundamentals, Equipment, Gem Species, Identification, Phenomena, Origin, Market & Grading, Care & Durability
- **4 Question Types**: Multiple choice, true/false, matching, fill-in-the-blank
- **Progress Tracking**: localStorage persistence for quiz history and category mastery

### Calculator Tools (`/tools/calculator`)

8 gemmological calculators:

| Calculator | Description |
|------------|-------------|
| Specific Gravity | Hydrostatic weighing with gem matching |
| RI Lookup | Compare measured RI against 15 common gems |
| Birefringence | Calculate from max/min RI readings |
| Critical Angle | Total internal reflection angle |
| Carat Estimator | Weight from dimensions (9 cut shapes) |
| Weight Converter | Carat ↔ Gram ↔ Milligram |
| Length Converter | mm ↔ inches |
| Temperature Converter | °C ↔ °F |

## Knowledge content & citations

Learn articles are sourced from [gemmology-knowledge](https://github.com/gemmology-dev/gemmology-knowledge) and pinned to a specific release tag — never `main` — so a content regression upstream never breaks the production site.

### Pinning

The pin is a single string constant:

```ts
// src/lib/knowledge-version.ts
export const KNOWLEDGE_VERSION = 'v1.2.0';
```

`scripts/sync-knowledge.ts` reads this constant, runs `git fetch --tags --force` against the knowledge clone, and checks out the matching tag in detached-HEAD state before copying `docs/learn/**/*.yaml` into `src/content/learn/`.

### Bumping the version

1. Edit `src/lib/knowledge-version.ts` and bump `KNOWLEDGE_VERSION` to the new tag.
2. `npm run sync` — checks out the new tag and refreshes `src/content/learn/`.
3. `npm run validate:citations` — fails the build if any `{cite:id}` marker is dangling or any `references:` entry violates the Zod schema (`book | journal | web | standard`).
4. `npm run build` — final check that the bibliography page renders.

### Bibliography & inline citations

Every learn article that cites sources declares them in a top-level `references:` array; prose embeds inline `{cite:id}` markers that render as numbered superscripts backlinking to the article footer (`role="doc-bibliography"`). The aggregated bibliography across all articles lives at [/about/sources/](https://gemmology.dev/about/sources/) and shows the active knowledge version with a link to the release tag.

The reference schema (CSL-JSON-inspired, four `kind`s, full field table) is documented in the upstream knowledge README under [Learn Content (YAML)](https://github.com/gemmology-dev/gemmology-knowledge#learn-content-yaml).

## Related Packages

- [cdl-parser](https://pypi.org/project/cdl-parser/) - Parse Crystal Description Language
- [crystal-geometry](https://pypi.org/project/crystal-geometry/) - 3D geometry generation
- [mineral-database](https://pypi.org/project/mineral-database/) - Mineral presets database
- [crystal-renderer](https://pypi.org/project/crystal-renderer/) - Render to SVG, STL, glTF

## License

MIT License - see [LICENSE](LICENSE) for details.
