# my-links

A custom version of all my links just for me!

A simple web app for storing and organizing links to other websites.

## Getting started

Requirements: [Node.js](https://nodejs.org/) 18+ and npm.

```bash
# Install dependencies
npm install

# Start the dev server (with hot reload)
npm run dev
```

Then open the printed URL (defaults to <http://localhost:5173>).

## Scripts

| Command           | What it does                                       |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot module reload.  |
| `npm run build`   | Type-check with `tsc`, then bundle for production. |
| `npm run preview` | Serve the production build locally to preview it.  |

The production build is output to the `dist/` directory.

## Tech stack

| Tech                                          | Role                    |
| --------------------------------------------- | ----------------------- |
| [TypeScript](https://www.typescriptlang.org/) | Language                |
| [Vite](https://vitejs.dev/)                   | Dev server & build tool |

### Why this stack?

- **TypeScript** — Static typing catches mistakes at compile time and makes the
  code easier to refactor as the app grows. The config runs in `strict` mode for
  maximum safety.
- **Vite** — A fast, modern build tool with near-instant startup and hot module
  reload for a smooth dev experience. It needs almost no configuration and bundles
  an optimized production build out of the box.
- **No UI framework (yet)** — The app starts with vanilla TypeScript and the DOM
  API to keep things minimal and avoid lock-in. A framework can be added later if
  the UI grows complex enough to need one.

## Project structure

```
my-links/
├── index.html          # Entry HTML, mounts the #app element
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript config (strict mode)
└── src/
    ├── main.ts         # App entry point
    └── vite-env.d.ts   # Vite type definitions
```
