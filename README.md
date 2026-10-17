# Nexus Browser OS

A modern, customizable productivity dashboard that replaces Chrome's New Tab page.
Built as a production-quality Chrome Extension (Manifest V3) with React, TypeScript, and Vite.

## What it is

Nexus Browser OS transforms Chrome's default new-tab experience into a clean, themable dashboard with quick actions, persistent settings, an extension popup, and a Chrome side panel. It is intentionally modular so features (tab management, productivity tools, etc.) can be added incrementally.

> **Scope of this release (foundation):** build system, Manifest V3 configuration, design system, reusable UI components, Chrome Storage integration, background service worker, lint/type/test tooling, and a working production build. Advanced features (tab manager, tools, sync settings UI) are planned for the next phase.

## Tech stack

| Layer | Choice |
|-------|--------|
| Extension manifest | Manifest V3 |
| UI framework | React 18.3 + TypeScript 5.7 |
| Build tool | Vite 6 |
| Styling | Modern CSS (CSS custom properties, dark/light themes) |
| Icons | lucide-react |
| Component utilities | clsx + class-variance-authority |
| Storage | Chrome Storage API (`storage.sync`) |
| Testing | Vitest + Testing Library + jsdom |
| Linting | ESLint 9 flat config |
| Formatting | Prettier |

## Project structure

```
nexus-browser-os/
├── dist/                     # Production build output (load this in Chrome)
├── src/
│   ├── public/               # Static assets copied verbatim to dist/
│   │   ├── manifest.json     # Manifest V3 configuration
│   │   └── icons/            # Extension icons (SVG)
│   ├── newtab.html           # New-tab page entry (chrome_url_overrides)
│   ├── popup.html            # Extension popup entry
│   ├── sidepanel.html        # Chrome side panel entry
│   ├── settings.html         # Settings page entry
│   ├── background/           # Service worker (event pages, MV3)
│   ├── entries/              # React entry point per page
│   ├── components/
│   │   ├── ui/               # Base design-system components (button, input, card, ...)
│   │   ├── layout/           # Page shell
│   │   └── navigation/       # Minimalist navbar
│   ├── design/               # Design tokens & global CSS
│   ├── hooks/                # useTheme, useStorage
│   ├── lib/                  # storage, Chrome API wrappers, utils
│   ├── types/                # App-level TypeScript types
│   └── test/                 # Vitest setup
├── index.html                # (none — entries are separate HTML files)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
├── .eslintignore
├── .gitignore
└── README.md
```

## Minimum permissions

The extension requests only what the foundation needs:

- `storage` — persistent user preferences (Chrome Storage API)
- `sidePanel` — Chrome side panel support

`tabs` is declared as `optional_permissions` and is not granted by default.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server (serves `src/`) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm run typecheck` | TypeScript `tsc --noEmit` |
| `npm run format` | Prettier write over `src/` |

## Loading the extension in Chrome

1. Build the extension:

   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the `dist/` folder of this project.
5. Open a new tab — the Nexus dashboard should replace the default page.
   The extension icon also opens the popup, and the side panel can be opened
   from the side panel button in the Chrome toolbar.

To reload the extension after code changes, run `npm run build` again and click
the reload (↻) icon on the extension card in `chrome://extensions`.

## Design system

`src/design/tokens.css` defines semantic HSL variables for light and dark
themes (colors, radius, shadows, transitions, spacing). `src/design/globals.css`
adds base styles and a small utility layer. Components are built with `clsx` +
`class-variance-authority` for consistent variants. Themes are toggled via
`useTheme()` and persisted in `chrome.storage.sync` under the `theme` key.

## Notes & limitations

- Service worker is registered as `"type": "module"`.
- Icons ship as SVG for simplicity; replace `src/public/icons/*.svg` with PNGs
  if required by your publishing process.
- `chrome.tabs` is optional and not granted by default; features requiring it
  should degrade gracefully.
- The dev server serves `src/` directly; some extension APIs (e.g. `chrome.*`)
  are unavailable outside a real extension context.

## Next phase

Tab management UI, productivity tools page, settings persistence for all
preferences, command palette, and additional tests.
