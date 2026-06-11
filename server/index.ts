import './failFast';

import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response, type NextFunction } from 'express';

import { logMessage } from '../scripts/logger';
import { exportPlaylists } from './playlistsExport';

import { getPlaylistsBodyHTML } from './documentsPlaylistsBody';
import { getDocumentSelectorBodyHTML } from './documentSelectorBody';
import { getDocumentViewerBodyHTML } from './documentViewer/documentViewerBody';

import { DOCUMENTS_DIR, ULF_SERVER_PORT, ULF_SERVER_URL } from '../config';

const app = express();
interface ClientConnection { res: Response; documentId: number; }
const clients = new Set<ClientConnection>();
let timeout: NodeJS.Timeout;

app.listen(ULF_SERVER_PORT, () => {
    console.log(`Server listening on ${ULF_SERVER_URL}`);
    ensureEmptyHighestIdDocument();
});


// Performance logging middleware
const requestTimer = (req: Request, res: Response, next: NextFunction) => {
    logMessage(`INFO: ${req.method} ${req.url} - Request received`);
    res.on('finish', () => {
        logMessage(`INFO: ${req.method} ${req.url} - Request finished with status ${res.statusCode}`);
    });
    next();
};
app.use(requestTimer);



app.get('/api/getDocumentSelectorBody', (req: Request, res: Response) => {
    const { discipline, classification, orderBy, order } = req.query;

    const result = getDocumentSelectorBodyHTML({
        discipline: discipline as string,
        classification: classification as string,
        orderBy: orderBy as string,
        order: order as string
    });

    res.json({ html: result });
});



app.get('/api/getDocumentViewerBody', async (req: Request, res: Response) => {
    const id = Number(req.query.id);
    const result = await getDocumentViewerBodyHTML(id);
    res.json({ html: result });
});



app.get('/api/getPlaylistsBody', (_req: Request, res: Response) => {
    const result = getPlaylistsBodyHTML();
    res.json({ html: result });
});



app.get('/api/exportPlaylists', async (req: Request, res: Response) => {
    const { folder } = req.query;
    await exportPlaylists(folder as string);
    res.json({ message: `Playlist(s) exported successfully.` });
});



app.get('/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const documentId = Number(req.query.id);
    const clientConnection: ClientConnection = { res, documentId };
    clients.add(clientConnection);

    req.on('close', () => { clients.delete(clientConnection); res.end(); });
});


// Express requires all 4 parameters to recognize this as an error-handling middleware
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : String(err);
    logMessage(`ERROR: ${req.method} ${req.url} - ${message}`);
    res.status(500).json({ error: 'Internal server error' });
});


function ensureEmptyHighestIdDocument() {
    try {
        const files = fs.readdirSync(DOCUMENTS_DIR);
        const ids = files
            .filter(f => f.endsWith('.md'))
            .map(f => parseInt(f.replace('.md', '')))
            .filter(id => !isNaN(id) && id <= 900);

        if (ids.length === 0) return;

        const maxId = Math.max(...ids);
        const maxIdFilePath = path.join(DOCUMENTS_DIR, `${maxId}.md`);

        const content = fs.readFileSync(maxIdFilePath, 'utf-8');
        if (content.trim().length > 0) {
            const nextId = maxId + 1;
            if (nextId <= 900) {
                fs.writeFileSync(path.join(DOCUMENTS_DIR, `${nextId}.md`), '');
                logMessage(`INFO: Created new empty document ${nextId}.md`);
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logMessage(`ERROR: ensureEmptyHighestIdDocument failed - ${message}`);
    }
}

fs.watch(DOCUMENTS_DIR, (_eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) { return; }
    const updatedId = parseInt(filename.replace('.md', ''));
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
        ensureEmptyHighestIdDocument();
        for (const client of clients) {
            if (client.documentId !== updatedId) { continue; }
            try {
                logMessage(`INFO: Document ${updatedId} was changed and it's currently being viewed. Sending update to client.`);
                const result = await getDocumentViewerBodyHTML(client.documentId);
                client.res.write(`data: ${JSON.stringify({ html: result })}\n\n`);
                logMessage(`INFO: Document ${updatedId} update sent to client.`);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                logMessage(`ERROR: Failed to send update for document ${updatedId}: ${message}`);
            }
        }
    }, 100);
});
