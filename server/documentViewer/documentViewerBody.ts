import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';

import { generateSRME } from '../SRME';
import { renderMath } from './renderMath';
import type { SRMEEntry } from '../SRME.schema';
import { logMessage } from '../../scripts/logger';
import { applyPostProcessors } from './postProcessors';
import { pandocRenderWithServer } from './pandocRenderer';
import { DOCUMENTS_DIR, DOCUMENT_VIEWER_TEMPLATE_PATH } from '../../config';


export async function getDocumentViewerBodyHTML(id: number): Promise<string> {
    logMessage(`INFO: Document viewer body generation started.`);

    // const SRME = JSON.parse(fs.readFileSync(SRME_PATH, 'utf-8'));
    const SRME = generateSRME(id);
    const entry = SRME.find((item: SRMEEntry) => item['ID'] === id);
    if (!entry) { return `<div class="error">Error! Exercise not found at SRME.json.</div>`; }

    const documentFilePath = path.join(DOCUMENTS_DIR, `${id}.md`);
    if (!fs.existsSync(documentFilePath)) { return `<div class="error">Error! Document file not found.</div>`; }
    const originalMarkdown = fs.readFileSync(documentFilePath, 'utf-8');
    // Replace "# Attempts" with "# Attempts{.attempts-section}" to hide it in print view
    let contentMarkdown = originalMarkdown.replace(/# Attempts/g, '# Attempts{.attempts-section}');

    let contentHTML = contentMarkdown;
    contentHTML = await pandocRenderWithServer(contentHTML);
    contentHTML = renderMath(contentHTML);
    contentHTML = applyPostProcessors(contentHTML, entry['Classification']);

    const template = fs.readFileSync(DOCUMENT_VIEWER_TEMPLATE_PATH, 'utf-8');
    const result = ejs.render(
        template,
        { element: entry, contentHTML },
        { filename: DOCUMENT_VIEWER_TEMPLATE_PATH }
    );

    logMessage(`INFO: Document viewer body generation finished.`);
    return result;
}
