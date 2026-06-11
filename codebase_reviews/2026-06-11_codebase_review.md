# ULFN Codebase Review & Improvement Recommendations

After reviewing every file in the project, here are my findings organized by category and severity.

---

## 🔴 Bugs & Correctness Issues

### 1. `exportPlaylists` ignores the `targetFolder` filter
In [playlistsExport.ts](file:///c:/Users/Dell/ULFN/server/playlistsExport.ts#L35-L46), `foldersToExport` is computed but **never used**. Line 46 calls `generateExportGroups()` which always reads from the full `PLAYLISTS_CONFIG`, so the `targetFolder` parameter has no effect.

```diff
- const exportGroups = generateExportGroups();
+ const exportGroups = generateExportGroups(foldersToExport);
```
`generateExportGroups` should accept a config argument instead of always reading the global constant.

---

### 2. `renderMath` has a dead `tag` reference to suppress lint
In [renderMath.ts:L64](file:///c:/Users/Dell/ULFN/server/documentViewer/renderMath.ts#L64), the line `tag; // Linting` exists solely to silence the `noUnusedLocals` warning. The real fix is to prefix the unused capture group with `_`:

```diff
- return html.replace(MATH_REGEX, (match, tag, attrs, innerHtml) => {
+ return html.replace(MATH_REGEX, (match, _tag, attrs, innerHtml) => {
    ...
-   tag; // Linting
  });
```

---

### 3. SRME is regenerated on every single request
[documentViewerBody.ts:L18](file:///c:/Users/Dell/ULFN/server/documentViewer/documentViewerBody.ts#L18) calls `generateSRME(id)` which re-reads the markdown file from disk, re-parses frontmatter, and re-calculates all metrics **on every page load and every SSE push**. Same issue in [documentSelectorBody.ts:L18](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L18) where `generateSRME()` reads **all** markdown files.

> [!WARNING]
> This means every filter/sort change on the Document Selector page triggers a full filesystem scan + frontmatter parse of every `.md` file. For 280+ documents, this is measurably slow.

---

### 4. Unsafe `req.query` casting
In [server/index.ts:L36-L43](file:///c:/Users/Dell/ULFN/server/index.ts#L36-L43), query params are cast directly as `string` with `as string`. Express query params can be `string | string[] | undefined`. If someone sends `?discipline=a&discipline=b`, it becomes an array and the code breaks silently.

---

### 5. `fs.watch` callback swallows async errors
In [server/index.ts:L94](file:///c:/Users/Dell/ULFN/server/index.ts#L94), the `forEach` callback is `async` but the promise is never awaited or caught. If `getDocumentViewerBodyHTML` throws, the error is silently swallowed.

---

### 6. `documentSelectorBody.ts` has stale inline HTML comment
[Line 115](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L115) contains `// Added missing option based on sort logic` which is rendered into the HTML sent to the client as visible text after the `</option>` tag.

```html
<option ...>Total Attempts</option> // Added missing option based on sort logic
```

---

## 🟡 Architecture & Maintainability

### 7. Duplicated `PlaylistsConfig` type
The type is defined both in [playlists.config.ts:L1-L7](file:///c:/Users/Dell/ULFN/server/playlists.config.ts#L1-L7) and [documentsPlaylistsBody.ts:L3-L9](file:///c:/Users/Dell/ULFN/server/documentsPlaylistsBody.ts#L3-L9). One should import from the other.

---

### 8. Client-side routing via `switch` + `document.createElement('script')`
[src/index.ts](file:///c:/Users/Dell/ULFN/src/index.ts) creates a `<script>` tag based on `window.location.pathname`. This is a fragile, hand-rolled SPA router. Consider:
- Using Vite's built-in multi-page app (MPA) mode with separate HTML entry points, or
- Using a tiny hash router to make the routing explicit and type-safe.

---

### 9. Inline HTML strings in server files
[documentSelectorBody.ts](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts) and [documentsPlaylistsBody.ts](file:///c:/Users/Dell/ULFN/server/documentsPlaylistsBody.ts) build HTML via string concatenation, while other views use EJS templates. This inconsistency makes the codebase harder to navigate. Choose one approach.

---

### 10. No error handling on client-side `fetch` calls
The client files ([documentSelector.ts](file:///c:/Users/Dell/ULFN/src/documentSelector.ts), [documentsPlaylists.ts](file:///c:/Users/Dell/ULFN/src/documentsPlaylists.ts), [documentViewer.ts](file:///c:/Users/Dell/ULFN/src/documentViewer.ts)) all call `fetch()` without checking `response.ok` or wrapping in try/catch. A 500 server error produces an unhandled JSON parse error instead of showing the user a message.

---

### 11. Mixed frontmatter key naming
The README says keys should be `Exercise Classification`, but the actual code and schema use `Classification`. This mismatch between documentation and implementation is confusing.

---

### 12. `code_bundler` Vite plugin is empty
[code_bundler.ts](file:///c:/Users/Dell/ULFN/vite_plugins/code_bundler.ts) has empty `files` arrays. It runs every build but produces two empty `.txt` files. Either populate it or remove it.

---

### 13. The `pnpm-workspace.yaml` exists but there are no workspace packages
This is a single-package repo. The workspace file adds confusion if there are no sub-packages.

---

## 🟢 Performance Improvements

### 14. Cache SRME data and invalidate on file change
Since you already have `fs.watch` on the documents directory, you could cache the parsed SRME data in-memory and invalidate it only when a `.md` file changes. This would eliminate the biggest performance bottleneck — re-reading 280+ files on every request.

```typescript
// Pseudocode
let srmeCache: SRMEEntry[] | null = null;

fs.watch(DOCUMENTS_DIR, () => { srmeCache = null; });

function getCachedSRME() {
    if (!srmeCache) srmeCache = generateSRME();
    return srmeCache;
}
```

---

### 15. `documentSelectorBody` reads the EJS template from disk on every call
[documentSelectorBody.ts:L17](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L17) calls `fs.readFileSync(DOCUMENT_CARD_TEMPLATE_PATH)` on every request. Cache this at module load.

---

### 16. `SRMG.ts` creates excessive `Date` objects
[SRMG.ts:L67-L83](file:///c:/Users/Dell/ULFN/server/SRMG.ts#L67-L83) — Inside the weekly LaMI loop (6 iterations), for each iteration it iterates over all entries and sorts all their attempts by creating new `Date` objects. This is O(weeks × entries × attempts × log(attempts)).

Pre-parse timestamps to epoch numbers once during SRME generation to avoid repeated `new Date()` calls.

---

### 17. `withPerformanceLog` in logger doesn't support async functions
[logger.ts:L13](file:///c:/Users/Dell/ULFN/scripts/logger.ts#L13) — The `withPerformanceLog` utility wraps sync functions but doesn't handle promises. If passed an async function, it logs completion immediately rather than waiting for the promise to resolve.

---

## 🔵 Security & Robustness

### 18. No input validation on document IDs
`Number(req.query.id)` on [server/index.ts:L51](file:///c:/Users/Dell/ULFN/server/index.ts#L51) accepts any string. Passing `id=../../etc/passwd` won't work due to `path.join`, but `id=NaN` or `id=-1` would produce confusing errors. Validate with something like:

```typescript
const id = Number(req.query.id);
if (!Number.isInteger(id) || id < 0) {
    res.status(400).json({ error: 'Invalid document ID' });
    return;
}
```

---

### 19. `exportPlaylists` has no error response handling
[server/index.ts:L65-L69](file:///c:/Users/Dell/ULFN/server/index.ts#L65-L69) — If `exportPlaylists` throws, Express 5 may handle it, but there's no explicit error boundary. A Playwright browser launch failure would crash the process.

---

### 20. Synchronous file I/O on request handlers
`fs.readFileSync` is used throughout the server request handlers ([documentSelectorBody.ts:L17](file:///c:/Users/Dell/ULFN/server/documentSelectorBody.ts#L17), [documentViewerBody.ts:L24](file:///c:/Users/Dell/ULFN/server/documentViewer/documentViewerBody.ts#L24), [SRME.ts:L24-L28](file:///c:/Users/Dell/ULFN/server/SRME.ts#L24-L28)). While fine for a single-user local tool, this blocks the event loop during file reads. If you plan to scale, switch to `fs.promises`.

---

## 🟣 Code Quality Quick Wins

### 21. Inconsistent `import` module specifiers
Some files import `from 'fs'`, others `from 'node:fs'`. Standardize on `node:fs` (the recommended Node.js convention).

---

### 22. Remove commented-out code
Several files contain large blocks of commented-out code:
- [documentViewer.ts:L195-L206](file:///c:/Users/Dell/ULFN/src/documentViewer.ts#L195-L206) — shuffle button
- [pandocRenderer.ts:L40-L71](file:///c:/Users/Dell/ULFN/server/documentViewer/pandocRenderer.ts#L40-L71) — child_process approach
- [documentSelector.ts:L53](file:///c:/Users/Dell/ULFN/src/documentSelector.ts#L53) — open in new tab

This code is preserved in git history. Removing it improves readability.

---

### 23. `info.ts` has unused variable `index`
[scripts/info.ts:L26](file:///c:/Users/Dell/ULFN/scripts/info.ts#L26) — `documents.forEach((doc, index) =>` — `index` is never used.

---

### 24. Excessive blank lines in `postProcessors.ts`
[postProcessors.ts](file:///c:/Users/Dell/ULFN/server/documentViewer/postProcessors.ts) has ~20 consecutive blank lines between functions (L13-L33, L52-L71). Standard convention is 1-2 blank lines between function declarations.

---

## 📋 Summary Table

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | `exportPlaylists` ignores filter | 🔴 Bug | Low |
| 2 | Dead `tag;` reference | 🟡 Lint | Trivial |
| 3 | SRME rebuilt every request | 🔴 Perf bug | Medium |
| 4 | Unsafe query param casting | 🟡 Robustness | Low |
| 5 | Swallowed async errors in `fs.watch` | 🔴 Bug | Low |
| 6 | HTML comment rendered as text | 🔴 Bug | Trivial |
| 7 | Duplicated `PlaylistsConfig` type | 🟡 DRY | Trivial |
| 8 | Hand-rolled SPA router | 🟡 Architecture | Medium |
| 9 | Mixed HTML generation approaches | 🟡 Consistency | Medium |
| 10 | No fetch error handling (client) | 🟡 UX | Low |
| 11 | README vs code key mismatch | 🟡 Docs | Trivial |
| 12 | Empty `code_bundler` plugin | 🟡 Dead code | Trivial |
| 13 | Unused `pnpm-workspace.yaml` | 🟡 Config | Trivial |
| 14 | Cache SRME data | 🟢 Performance | Medium |
| 15 | Cache EJS template reads | 🟢 Performance | Low |
| 16 | Excessive Date objects in SRMG | 🟢 Performance | Medium |
| 17 | `withPerformanceLog` not async-safe | 🟡 Utility | Low |
| 18 | No ID validation | 🔵 Security | Low |
| 19 | No error boundary on export | 🔵 Robustness | Low |
| 20 | Sync file I/O in handlers | 🟡 Scalability | Medium |
| 21 | Inconsistent import specifiers | 🟣 Style | Trivial |
| 22 | Commented-out code | 🟣 Readability | Trivial |
| 23 | Unused `index` variable | 🟣 Lint | Trivial |
| 24 | Excessive blank lines | 🟣 Style | Trivial |

---

## Recommended Priority Order

1. **Fix bugs first** — Items 1, 5, 6 (all trivial/low effort)
2. **Add SRME caching** — Item 14 (the single biggest performance win)
3. **Add client error handling** — Item 10
4. **Input validation** — Items 4, 18
5. **Code cleanup** — Items 2, 7, 11, 12, 21, 22, 23, 24

Would you like me to implement any of these improvements?
