# ULFN Codebase Review (v4)

> **Date**: 2026-06-11
> **Focus**: Security, Performance, and Maintainability

## 1. Follow-up from Previous Reviews

While some issues (like snippet expansion regex and event delegation) have been addressed, several key findings remain unresolved:

### 1.1 🔴 Missing API Input Validation
In `server/index.ts`, query parameters are still forcibly cast to strings:
```ts
const { discipline, classification, orderBy, order } = req.query;
const result = getDocumentSelectorBodyHTML({
    discipline: discipline as string, // <--- Unsafe cast
    // ...
});
```
Although `SRME.schema.ts` imports Zod, it is not being used to validate these incoming requests, which leaves the app open to unexpected input types (e.g., arrays).

### 1.2 🔴 XSS via Unescaped EJS Metadata
In `server/ejs_templates/documentViewer.ejs`, the metadata table uses `<%-` (unescaped) instead of `<%=` (escaped). While this is a local tool, it is best practice to escape YAML frontmatter values to prevent potential injection.

### 1.3 🔴 Disk I/O Bottlenecks
- `documentSelectorBody.ts` re-reads the EJS template from disk on every API call.
- `generateSRME()` continues to read all Markdown files on every request. Implement an in-memory cache that updates via `fs.watch`.

### 1.4 🟡 HTML Comment Leak
In `server/documentSelectorBody.ts`, a JS comment leaked into the HTML template literal:
```html
<option ${isSelected('Total Attempts', selectedOrderBy)}>Total Attempts</option> // Added missing option based on sort logic
```

## 2. New Findings & Improvements

### 2.1 🟡 Main Thread Blocking in Audio Encoding
**File**: `src/voiceRecording.ts`
The WebM to MP3 conversion using `lamejs` happens synchronously on the main thread:
```ts
const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
// ... loop encodes synchronously ...
```
For longer recordings, this will freeze the browser UI until conversion finishes. 
**Recommendation**: Move the `lamejs` encoding logic into a Web Worker so the UI remains responsive during processing.

### 2.2 🟡 Unbounded Concurrency in PDF Export
**File**: `server/playlistsExport.ts`
The PDF export uses `Promise.all` to process all documents in a subfolder simultaneously:
```ts
await Promise.all(group.documents.map(async ({ documentId, url }) => { ... }))
```
If a playlist contains dozens of documents, this will open dozens of Playwright pages concurrently, which can easily overwhelm the local server and Chromium instance, leading to timeouts or crashes. 
**Recommendation**: Use an asynchronous `for...of` loop or a concurrency-limited map (e.g., `p-map`) to export documents sequentially or in smaller batches.

### 2.3 🟡 Redundant Sorting in SRMG Calculation
**File**: `server/SRMG.ts`
The weekly LaMI calculation has a nested loop that re-sorts the attempts for every document, 6 times (once per week):
```ts
for (let i = 5; i >= 0; i--) {
    // ...
    filteredEntries.forEach(entry => {
        const relevantAttempts = entry['Attempts']
            .filter(...)
            .sort((a, b) => new Date(a['Timestamp']).getTime() - new Date(b['Timestamp']).getTime());
```
**Recommendation**: Pre-sort the `Attempts` array once per entry *before* the week loop, and simply filter the pre-sorted array inside the loop. This reduces redundant processing significantly.

### 2.4 🟢 Separation of Concerns (HTML in TS)
**Files**: `server/documentSelectorBody.ts`, `server/documentsPlaylistsBody.ts`
These files generate large chunks of HTML directly inside TypeScript using template literals (which also use inline styles). Since `ejs` is already installed and used for `documentCard.ejs`, these templates should be extracted into `server/ejs_templates/` to separate business logic from presentation and make styling more maintainable.

## 3. Prioritized Action Plan

1. **Security**: Fix XSS in `documentViewer.ejs` by changing `<%-` to `<%=` for metadata fields.
2. **Correctness**: Validate `server/index.ts` query parameters using Zod to handle edge cases safely.
3. **Performance**: Move `lamejs` audio encoding to a Web Worker in `src/voiceRecording.ts`.
4. **Performance**: Pre-sort attempts in `server/SRMG.ts` to optimize the LaMI calculation.
5. **Stability**: Change `Promise.all` to a sequential loop in `server/playlistsExport.ts` to avoid Chromium crashes.
6. **Performance**: Cache SRME data in memory and pre-compile EJS templates instead of accessing the disk on every request.
7. **Cleanup**: Remove the trailing HTML comment in `documentSelectorBody.ts` and migrate inline TS HTML strings to separate EJS templates.
