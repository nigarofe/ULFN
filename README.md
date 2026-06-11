# ULFN — ULF Navigator

A local-first study tool for managing, reviewing, and practicing markdown-based exercises with built-in spaced repetition metrics.

## Overview

ULFN renders markdown documents into interactive exercises — multiple choice, cloze (fill-in-the-blank), keyword scoring, and deterministic problems — with live reload, math rendering (KaTeX), diagram support (Mermaid), and spaced repetition analytics. Documents are organized into playlists and can be exported to PDF.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | Vanilla TypeScript, Vite, morphdom, Chart.js |
| Server | Express 5, EJS templates |
| Rendering | Pandoc (server mode), KaTeX, Mermaid |
| Export | Playwright (headless Chromium → PDF) |
| Validation | Zod, gray-matter |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/)
- [Pandoc](https://pandoc.org/installing.html) (must be on PATH)

### Installation

```bash
pnpm install
```

### Running

Three processes need to run concurrently:

```bash
# Terminal 1 — Pandoc server (must start first)
pnpm pandoc-server

# Terminal 2 — Express API server
pnpm ulfn-server

# Terminal 3 — Vite dev server
pnpm vite-server
```

The Vite dev server waits for the Express server (port 3001) before starting, then opens at `http://localhost:5173`.

### Ports

| Service | Port |
|---------|------|
| Express API | 3001 |
| Pandoc | 3030 |
| Vite | 5173 |

## Project Structure

```
├── config.ts                  # Shared paths, ports, and constants
├── index.html                 # Vite entry point (empty body, scripts load per-page)
│
├── src/                       # Client-side code (bundled by Vite)
│   ├── index.ts               # Client router — loads page scripts by pathname
│   ├── documentSelector.ts    # Browse & filter documents with charts
│   ├── documentViewer.ts      # View a single document with SSE live reload
│   ├── documentsPlaylists.ts  # Playlist management and PDF export trigger
│   ├── initCharts.ts          # Chart.js dashboard (distribution, scatter, weekly)
│   ├── voiceRecording.ts      # MediaRecorder → MP3 conversion (lamejs)
│   ├── utils.ts               # Shared client utilities
│   └── styles/                # CSS organized by component
│
├── server/                    # Express API server
│   ├── index.ts               # Routes, SSE, and fs.watch for live reload
│   ├── failFast.ts            # Startup validation (files, dirs, URLs, Pandoc)
│   ├── SRME.ts                # Per-document spaced repetition metrics
│   ├── SRME.schema.ts         # Zod schema for SRME data
│   ├── SRMG.ts                # Global/aggregate metrics and chart data
│   ├── documentSelectorBody.ts    # HTML generation for the document list
│   ├── documentsPlaylistsBody.ts  # HTML generation for playlists page
│   ├── playlists.config.ts        # Playlist definitions (folder → documents)
│   ├── playlistsExport.ts         # Playwright PDF export
│   ├── ejs_templates/             # EJS partials (cards, viewer, footer, controls)
│   └── documentViewer/
│       ├── documentViewerBody.ts  # Orchestrates markdown → HTML pipeline
│       ├── pandocRenderer.ts      # Pandoc server API client
│       ├── renderMath.ts          # KaTeX rendering with caching
│       └── postProcessors.ts      # Exercise-specific HTML transforms
│
├── scripts/                   # CLI utilities (run with `npx tsx scripts/<name>`)
│   ├── info.ts                # Document validation and classification counts
│   ├── logger.ts              # File-based logging (app.log)
│   └── normalize-hr-spacing.ts  # Normalizes `---` spacing in markdown files
│
├── vite_plugins/
│   ├── snippet_expander.ts    # Expands macros (/timestamp, /fbe, /keywords) on save
│   └── code_bundler.ts        # Concatenates source files into .txt bundles
│
└── public/
    ├── documents/             # Markdown exercise files (numbered: 1.md, 2.md, ...)
    ├── media/                 # Images referenced by documents
    ├── icons/                 # UI icons
    └── llm_prompts/           # LLM prompt templates for generating exercises
```

## Documents

Each document is a numbered markdown file (`public/documents/<id>.md`) with YAML frontmatter:

```yaml
---
Classification : Multiple Choice Exercise
Discipline     : Mathematics
Source          : Some Book, Author, Year
Description    : Brief description of the exercise
---
```

### Exercise Types

| Classification | Interactive Features |
|----------------|---------------------|
| **Multiple Choice Exercise** | Checkbox options are converted to clickable buttons; answers shuffle on each load |
| **Cloze Exercise** | `**{answer1\|answer2}**` becomes a text input with real-time validation |
| **Keywords Exercise** | Student responses are scored against expected keyword rules with highlighting |
| **Deterministic Problem** | Standard proposition → step-by-step → answer structure |

### Spaced Repetition

Each document has an `# Attempts` section tracking review history:

```markdown
# Attempts
2024-11-07T06:00:00Z 0
2025-01-24T06:00:00Z 1
```

Code `1` = solved without help, `0` = needed help. The system computes:

| Metric | Meaning |
|--------|---------|
| **DSLA** | Days Since Last Attempt |
| **LaMI** | Last Memory Interval (days between last two successful attempts) |
| **PMG-D** | Progress Margin in Days (DSLA − LaMI) |
| **PMG-X** | Progress Margin Multiplier (DSLA ÷ LaMI); ≤ 1 means due for review |

### Snippet Macros

When editing documents with the Vite server running, these macros auto-expand on save:

| Macro | Expands To |
|-------|-----------|
| `/ts` or `/timestamp` | Current ISO timestamp |
| `/fbe` | Full exercise template (Proposition → Notes → Step-by-step → Answer → Attempts) |
| `/keywords` | Keywords exercise template |

## Pages

- **`/documentsPlaylists`** — Home page. Lists playlists grouped by folder with export controls.
- **`/documentSelector`** — Filterable/sortable document list with SRM dashboard charts.
- **`/documentViewer?id=<n>`** — Renders a single document. Supports playlist navigation (← →), SSE live reload, and voice recording.

## PDF Export

Playlists can be exported to PDF via the playlists page. Uses Playwright to render each document in a headless browser with print media styles, then saves to the `exports/` directory.
