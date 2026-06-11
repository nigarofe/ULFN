# ULFN Codebase Review

> **Reviewed**: All source files across `server/`, `src/`, `scripts/`, `vite_plugins/`, configuration files, EJS templates, and CSS.
> **Date**: 2026-06-11

---

## 1. Architecture Overview

ULFN is a **local-first study tool** with a clean three-process architecture:

```mermaid
graph LR
    A["Pandoc Server :3030"] --> B["Express API :3001"]
    B --> C["Vite Dev :5173"]
    C -->|proxy /api, /events| B
    B -->|SSE| C
    B -->|fs.watch| D["public/documents/*.md"]
```

| Strength | Detail |
|---|---|
| **Clear separation** | Express handles data + rendering; Vite handles bundling + HMR; Pandoc handles markdown→HTML |
| **Minimal dependency surface** | Only 9 runtime deps — no ORM, no database, no auth framework |
| **Local-first philosophy** | Data lives in the filesystem (markdown files with YAML frontmatter + inline `# Attempts` sections) |
| **Smart rendering pipeline** | Markdown → Pandoc → KaTeX → Post-processors — each step is isolated and composable |
| **Fail-fast startup** | [failFast.ts](file:///c:/Users/Dell/ULFN/server/failFast.ts) validates all dependencies before serving |

---

## 2. Bugs & Correctness Issues

### 2.1 🔴 `DSLA` / `PMG-D` / `PMG-X` display `0` instead of empty in EJS

**File**: [documentViewer.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/documentViewer.ejs#L46-L54)

```ejs
<td><%- element['SRME']['DSLA'] || '&nbsp;' %></td>
```

The `||` operator treats `0` as falsy. A document with `DSLA = 0`, `PMG-D = 0`, or `PMG-X = 0` will display `&nbsp;` instead of `0`. The card template ([documentCard.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/documentCard.ejs#L52-L73)) correctly uses `??` — the viewer template should do the same.

**Fix**: Replace `||` with `??` in all three rows of the viewer template.

---

### 2.2 🟡 Snippet expander doesn't chain expansions

**File**: [snippet_expander.ts](file:///c:/Users/Dell/ULFN/vite_plugins/snippet_expander.ts#L21-L38)

If a file contains both `/ts` and `/fbe`, only the `/ts` replacement is written:

```ts
if (content.includes('/ts')) {
    updatedContent = content.replace(/\/ts/g, isoTimestamp); // ← from original
}
if (content.includes('/fbe')) {
    updatedContent = content.replace(/\/fbe/g, psaaContent); // ← also from original, overwrites /ts result
}
```

Each branch replaces from `content` (original), not from `updatedContent`. If both macros exist, the second overwrites the first.

**Fix**: Chain replacements from a single mutable variable, and initialize `updatedContent = content` at the top.

---

### 2.3 🟡 `generateSRME` single-document mode still returns full array

**File**: [SRME.ts](file:///c:/Users/Dell/ULFN/server/SRME.ts#L14-L60) and [documentViewerBody.ts](file:///c:/Users/Dell/ULFN/server/documentViewer/documentViewerBody.ts#L18-L19)

When called with a `documentId`, `generateSRME` returns a single-element array, then the caller does `.find()`. This works, but the API is misleading — a caller might expect the full list. Explicitly returning a single entry (or the entry directly) for single-document mode would be clearer and prevent accidental misuse.

---

### 2.4 🟡 Regex collision in snippet expander

**File**: [snippet_expander.ts](file:///c:/Users/Dell/ULFN/vite_plugins/snippet_expander.ts#L21)

The regex `/\/ts/g` will match any occurrence of `/ts` in the file — including inside URLs like `https://...`, paths like `/tslint.json`, or inside code blocks. This could corrupt document content.

**Fix**: Use word-boundary-aware patterns, e.g., `/(?<=^|\s)\/ts(?=\s|$)/gm` or anchor to line starts.

---

### 2.5 🟡 `documentSelector.ts` event listeners silently fail after morphdom

**File**: [documentSelector.ts](file:///c:/Users/Dell/ULFN/src/documentSelector.ts#L36-L43)

After `update()` calls `morphdom`, the `<select>` elements are replaced in the DOM. However, the `onchange` handlers are attached to the *original* elements (lines 36–43), not the new ones. These handlers survive only because morphdom patches the existing DOM rather than replacing wholesale — but if the morphdom key heuristic ever fails and creates new `<select>` elements, the handlers will be lost silently.

**Recommendation**: Use event delegation on `body` (like you already do for click events) instead of direct `.onchange` assignment.

---

### 2.6 🟢 Unused parameter in `info.ts`

**File**: [info.ts](file:///c:/Users/Dell/ULFN/scripts/info.ts#L26)

`index` in `documents.forEach((doc, index) => {` is never used. Minor, but `noUnusedParameters` is enabled in tsconfig — this may already be flagged.

---

## 3. Security Concerns

### 3.1 🔴 XSS via unescaped EJS metadata

**File**: [documentViewer.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/documentViewer.ejs#L68-L80)

The metadata table uses unescaped output `<%-`:

```ejs
<td><%- element['Classification'] || '' %></td>
<td><%- element['Discipline'] || '' %></td>
<td><%- element['Source'] || '' %></td>
<td><%- element['Description'] || '' %></td>
```

If any YAML frontmatter field contains HTML (e.g., `Description: <img src=x onerror=alert(1)>`), it will be rendered as raw HTML. Since this is a local-only tool, the risk is low, but it's still a **defense-in-depth** violation.

**Fix**: Use `<%= ... %>` (escaped) for metadata fields. The `contentHTML` field correctly uses `<%-` because it's already processed HTML.

---

### 3.2 🟡 No input validation on API query parameters

**File**: [index.ts (server)](file:///c:/Users/Dell/ULFN/server/index.ts#L35-L46)

```ts
const { discipline, classification, orderBy, order } = req.query;
const result = getDocumentSelectorBodyHTML({
    discipline: discipline as string,
    // ...
});
```

Query parameters are cast with `as string` without validation. Passing arrays (`?discipline=a&discipline=b`) would cause `discipline` to be `string[]`, not `string`, leading to unexpected behavior downstream. Similarly, the `id` parameter on line 51 is `Number(req.query.id)` without checking for `NaN`.

**Fix**: Validate with Zod schemas (you already have the dependency) or at minimum add type guards.

---

### 3.3 🟡 No error handling for `exportPlaylists` route

**File**: [index.ts (server)](file:///c:/Users/Dell/ULFN/server/index.ts#L65-L69)

```ts
app.get('/api/exportPlaylists', async (req, res) => {
    const { folder } = req.query;
    await exportPlaylists(folder as string);
    res.json({ message: `Playlist(s) exported successfully.` });
});
```

If `exportPlaylists` throws (e.g., Playwright can't launch, timeout, folder not found), the error middleware catches it, but the client gets a generic 500. The route should handle the "folder not found" case explicitly and return a 400.

---

## 4. Performance Analysis

### 4.1 🔴 `generateSRME()` is called on every request — reads all files from disk

**File**: [documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L18)

Every call to `/api/getDocumentSelectorBody` calls `generateSRME()`, which:
1. Reads the entire documents directory (`readdirSync`)
2. Reads every `.md` file (`readFileSync`)
3. Parses YAML frontmatter for each
4. Computes metrics for each

For 284+ documents, this is a **full-disk scan on every filter change**. As the document count grows, this becomes the primary bottleneck.

**Fix**: Implement an in-memory cache of SRME data, invalidated by `fs.watch` events. The comment on [SRME.ts:56](file:///c:/Users/Dell/ULFN/server/SRME.ts#L56) shows you previously considered writing to `SRME.json` — an in-memory `Map<number, SRMEEntry>` would be even better.

---

### 4.2 🟡 EJS template re-read from disk on every render

**File**: [documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L17)

```ts
const templateStr = fs.readFileSync(DOCUMENT_CARD_TEMPLATE_PATH, 'utf-8');
```

This reads the EJS template from disk on every API call. Templates rarely change at runtime.

**Fix**: Read once at module load or use `ejs.compile()` to pre-compile templates.

---

### 4.3 🟡 SRMG weekly LaMI calculation is O(entries × weeks × attempts)

**File**: [SRMG.ts](file:///c:/Users/Dell/ULFN/server/SRMG.ts#L56-L93)

The nested loop iterates 6 weeks × all entries × all attempts per entry, re-sorting and re-filtering attempts each time. For 284 documents with ~5 attempts each, this is ~8,500 iterations with sorting inside.

**Fix**: Pre-sort attempts once per entry, then binary search for the target date cutoff.

---

### 4.4 🟢 Math cache is unbounded

**File**: [renderMath.ts](file:///c:/Users/Dell/ULFN/server/documentViewer/renderMath.ts#L4)

```ts
const mathCache = new Map<string, string>();
```

The cache never evicts entries. For a local-only tool this is fine — KaTeX renderings are small and the document count is bounded. But worth noting for future scalability.

---

## 5. Code Quality & Maintainability

### 5.1 Project-level observations

| Area | Assessment |
|---|---|
| **TypeScript strictness** | Good — `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` are all enabled |
| **Zod validation** | Schema is defined ([SRME.schema.ts](file:///c:/Users/Dell/ULFN/server/SRME.schema.ts)) but **never used for runtime validation** — only for type inference. The schema should `parse()` the data, especially for the YAML frontmatter |
| **Error messages** | Inconsistent — some use `logMessage()`, some use `console.error()`, some use both |
| **Naming** | Mostly clear, but some acronyms are opaque without context (SRME, SRMG, LAS, LaMI, PMG-D, PMG-X). The README documents these well |
| **File organization** | Excellent — numbered CSS files, clear separation of server/client/scripts, EJS templates in their own directory |
| **Code comments** | Good density — complex regex patterns are documented, design decisions are explained inline |

---

### 5.2 Dead/unused code

| File | Item | Type |
|---|---|---|
| [documentValidator.ts](file:///c:/Users/Dell/ULFN/src/documentValidator.ts) | Empty file | Route target (`/documentValidator`) leads to blank page |
| [playlistControls.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/playlistControls.ejs#L4) | `shufflePlaylistButton` | Button is rendered in HTML but handler is commented out in [documentViewer.ts](file:///c:/Users/Dell/ULFN/src/documentViewer.ts#L195-L206) |
| [performanceTester.ts](file:///c:/Users/Dell/ULFN/server/documentViewer/performanceTester.ts) | `renderAllDocumentsWithPandoc` | Never called anywhere — development-only utility |
| [pandocRenderer.ts](file:///c:/Users/Dell/ULFN/server/documentViewer/pandocRenderer.ts#L40-L71) | `pandocRenderWithProcess` | Commented-out function — 30 lines of dead code |
| [code_bundler.ts](file:///c:/Users/Dell/ULFN/vite_plugins/code_bundler.ts#L6-L10) | `bundleConfig` | Only bundles `index.html` — seems like a development artifact |
| [SRME.ts](file:///c:/Users/Dell/ULFN/server/SRME.ts#L56) | `fs.writeFileSync` debug line | Commented-out persistence |

---

### 5.3 Inline styles in server-generated HTML

**Files**: [documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L95), [documentsPlaylistsBody.ts](file:///c:/Users/Dell/ULFN/server/documentsPlaylistsBody.ts#L38-L49)

Both modules heavily use inline `style=""` attributes in their HTML template literals:

```ts
`<h1 style="text-align: center; margin: 0 0 1rem; padding: 0; font-size: 2.5rem;">Document Selector</h1>`
```

This bypasses the well-organized CSS system in `src/styles/` and makes styling harder to maintain.

**Fix**: Move these styles to CSS classes and reference them from the generated HTML.

---

### 5.4 HTML comment leaking into production markup

**File**: [documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L115)

```html
<option ${isSelected('Total Attempts', selectedOrderBy)}>Total Attempts</option> // Added missing option based on sort logic
```

This JS-style comment (`// Added missing...`) is inside an HTML template literal — it will be rendered as visible text in the HTML output.

---

## 6. Architecture Suggestions

### 6.1 Consider caching the SRME data in memory

The biggest architectural improvement would be an in-memory SRME store:

```
fs.watch(DOCUMENTS_DIR) → update single entry in Map
API request → read from Map (instant)
```

This eliminates the full-disk scan pattern and makes the selector page essentially instant.

---

### 6.2 Typed API layer

The server has 4 API endpoints, all returning `{ html: string }` or `{ message: string }`. Consider defining shared response types in a common file imported by both server and client — this catches contract breaks at compile time.

---

### 6.3 Client-side routing

The SPA router in [src/index.ts](file:///c:/Users/Dell/ULFN/src/index.ts#L6-L23) uses `switch (pathname)` and top-level `await import()`. This means:
- The full-page reload on navigation (`window.location.href = ...`) is necessary since there's no client-side navigation framework
- The `default` case silently redirects to `/documentsPlaylists` without notifying the user

This is pragmatic for the current scale. If the app grows, consider adding a lightweight router or at least handling `popstate` events for browser back/forward.

---

## 7. Prioritized Recommendations

### Must Fix (Correctness / Data Integrity)

| # | Issue | File | Effort |
|---|---|---|---|
| 1 | Fix `||` to `??` for SRME values in viewer template | [documentViewer.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/documentViewer.ejs) | 5 min |
| 2 | Fix snippet expander chaining bug | [snippet_expander.ts](file:///c:/Users/Dell/ULFN/vite_plugins/snippet_expander.ts) | 10 min |
| 3 | Fix HTML comment in selector body | [documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L115) | 1 min |

### Should Fix (Security / Robustness)

| # | Issue | File | Effort |
|---|---|---|---|
| 4 | Escape metadata in viewer EJS (`<%-` → `<%=`) | [documentViewer.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/documentViewer.ejs) | 5 min |
| 5 | Validate API query params (at least guard `NaN`) | [server/index.ts](file:///c:/Users/Dell/ULFN/server/index.ts) | 20 min |
| 6 | Make snippet regex word-boundary-aware | [snippet_expander.ts](file:///c:/Users/Dell/ULFN/vite_plugins/snippet_expander.ts) | 10 min |

### Should Fix (Performance)

| # | Issue | File | Effort |
|---|---|---|---|
| 7 | Cache SRME data in-memory, invalidate on fs.watch | [SRME.ts](file:///c:/Users/Dell/ULFN/server/SRME.ts) | 1-2 hrs |
| 8 | Pre-compile EJS templates at startup | [documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts) | 15 min |

### Nice to Have (Cleanup)

| # | Issue | File | Effort |
|---|---|---|---|
| 9 | Remove empty `documentValidator.ts` and route, or implement it | [documentValidator.ts](file:///c:/Users/Dell/ULFN/src/documentValidator.ts) | 5 min |
| 10 | Remove or gate the shuffle button in [playlistControls.ejs](file:///c:/Users/Dell/ULFN/server/ejs_templates/playlistControls.ejs) | Template + client | 5 min |
| 11 | Move inline styles to CSS classes | Multiple | 30 min |
| 12 | Clean up dead commented code in `pandocRenderer.ts` | [pandocRenderer.ts](file:///c:/Users/Dell/ULFN/server/documentViewer/pandocRenderer.ts) | 5 min |
| 13 | Use event delegation for selector `<select>` elements | [documentSelector.ts](file:///c:/Users/Dell/ULFN/src/documentSelector.ts) | 15 min |

---

## 8. Overall Assessment

> [!TIP]
> **Verdict**: This is a well-crafted, focused codebase. The architecture is clean, the code is readable, and the domain complexity (spaced repetition metrics, exercise post-processors, live reload via SSE) is handled without over-engineering. The bugs found are minor and the security issues are low-risk given the local-only deployment model.

**Strongest aspects:**
- The rendering pipeline (Pandoc → KaTeX → post-processors) is elegant and extensible
- The fail-fast startup pattern catches misconfigurations immediately
- CSS is methodically organized with numbered files for load-order control
- The spaced repetition algorithm is well-documented and mathematically sound

**Biggest opportunity:**
- In-memory caching of SRME data would eliminate the main performance bottleneck (full-disk scan per request) and set the foundation for faster iteration on future features like the "Weekly LaMI fix" noted in [TODO.md](file:///c:/Users/Dell/ULFN/TODO.md#L21)
