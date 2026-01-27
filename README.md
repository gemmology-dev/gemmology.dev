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

# Copy database files
npm run copy-db

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

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
│   ├── auth/         # Authentication and protected routes
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

## Related Packages

- [cdl-parser](https://pypi.org/project/cdl-parser/) - Parse Crystal Description Language
- [crystal-geometry](https://pypi.org/project/crystal-geometry/) - 3D geometry generation
- [mineral-database](https://pypi.org/project/mineral-database/) - Mineral presets database
- [crystal-renderer](https://pypi.org/project/crystal-renderer/) - Render to SVG, STL, glTF

## License

MIT License - see [LICENSE](LICENSE) for details.
