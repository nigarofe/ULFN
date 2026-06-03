import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { DOCUMENTS_DIR } from '../../config';
import { logMessage } from '../../scripts/logger';
import { pandocRenderWithServer } from './pandocRenderer';

export async function renderAllDocumentsWithPandoc(): Promise<void> {
    const start = performance.now();
    const entries = await fs.readdir(DOCUMENTS_DIR);
    const files = entries.filter((name) => name.endsWith('.md'));

    for (let i = 0; i < files.length; i += 1) {
        const name = files[i];
        const filePath = path.join(DOCUMENTS_DIR, name);
        const markdown = await fs.readFile(filePath, 'utf-8');

        console.log(`Rendering ${i + 1}/${files.length}: ${name}`);
        await pandocRenderWithServer(markdown);
    }

    const durationMs = Math.round(performance.now() - start);
    logMessage(`INFO: renderAllDocumentsWithPandoc finished in ${durationMs}ms (${files.length} files)`);
}
