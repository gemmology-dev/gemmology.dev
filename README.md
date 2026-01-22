# gemmology.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Crystal structure visualization and gemmological reference for FGA students and professionals.

**Live site**: [https://gemmology.dev](https://gemmology.dev)

## Features

- **Crystal Gallery**: 50+ mineral presets with FGA-accurate crystallographic data
- **CDL Playground**: Interactive Crystal Description Language editor with live preview
- **Documentation**: Complete API reference, CLI documentation, and CDL specification
- **Learn**: FGA curriculum-aligned content on crystallography and gemmology

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
│   └── layout/       # Layout components (Header, Footer)
├── hooks/            # React hooks (useCrystalDB, useCDLValidation)
├── layouts/          # Astro layouts
├── lib/              # Utilities (db.ts, monaco-cdl.ts)
├── pages/            # Astro pages
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

## Related Packages

- [cdl-parser](https://pypi.org/project/cdl-parser/) - Parse Crystal Description Language
- [crystal-geometry](https://pypi.org/project/crystal-geometry/) - 3D geometry generation
- [mineral-database](https://pypi.org/project/mineral-database/) - Mineral presets database
- [crystal-renderer](https://pypi.org/project/crystal-renderer/) - Render to SVG, STL, glTF

## License

MIT License - see [LICENSE](LICENSE) for details.
