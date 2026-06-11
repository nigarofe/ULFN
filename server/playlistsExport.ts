import path from 'node:path';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

import { VITE_SERVER_URL } from '../config';
import { PLAYLISTS_CONFIG } from '../playlists.config';

type exportGroup = {
    directorySegments: string[];
    documents: {
        documentId: string;
        url: string;
    }[];
}
// console.log(JSON.stringify(generateExportGroups()));

function sanitizePathSegment(segment: string): string {
    const safeSegment = segment.replace(/[\\/?%*:|"<>]/g, '-').trim();
    return safeSegment.length > 0 ? safeSegment : 'untitled';
}

function generateExportGroups(config: typeof PLAYLISTS_CONFIG): exportGroup[] {
    return config.flatMap((group) =>
        group.subfolders.map((subfolder) => ({
            directorySegments: [group.folder, subfolder.subfolder],
            documents: subfolder.playlist.map((documentId) => ({
                documentId: String(documentId),
                url: `${VITE_SERVER_URL}/documentViewer?id=${documentId}`,
            })),
        }))
    );
}


export async function exportPlaylists(targetFolder?: string) {
    // If a target folder is provided, filter the config. Otherwise, export all.
    const foldersToExport = targetFolder
        ? PLAYLISTS_CONFIG.filter(p => p.folder === targetFolder)
        : PLAYLISTS_CONFIG;

    if (foldersToExport.length === 0) {
        throw new Error('Folder not found');
    }

    const browser = await chromium.launch();
    const exportGroups = generateExportGroups(foldersToExport);

    for (const group of exportGroups) {
        const displayDirectory = path.join(...group.directorySegments);
        console.log(`Exporting ${displayDirectory}...`);
        console.log('Exporting Links:', group.documents.map((doc) => doc.url));

        const safeSegments = group.directorySegments.map(sanitizePathSegment);
        const exportDirectory = path.join('exports', ...safeSegments);
        await fs.mkdir(exportDirectory, { recursive: true });

        await Promise.all(group.documents.map(async ({ documentId, url }) => {
            const page = await browser.newPage();
            try {
                // documentViewer keeps an SSE connection open, so `networkidle` never settles.
                // Wait for initial HTML load plus the API response that injects document content.
                await Promise.all([
                    page.waitForResponse(
                        (response) => response.url().includes(`/api/getDocumentViewerBody/?id=${documentId}`) && response.ok(),
                        { timeout: 3000 }
                    ),
                    page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 }),
                ]);

                await page.emulateMedia({ media: 'print' }); // Keep print media so print styles match Ctrl+P output.
                await page.waitForFunction(() => {
                    return (window as Window & { __pdfReady?: boolean }).__pdfReady === true;
                }, { timeout: 7000 });

                const date = new Date().toISOString().split('T')[0];
                const fileName = `${documentId}_${date}.pdf`;

                const filePath = path.join(exportDirectory, fileName);
                await page.pdf({
                    path: filePath,
                    format: 'A4',
                    printBackground: true,
                    preferCSSPageSize: true
                });
                console.log(`Exported ${url} to ${filePath}`);
            } catch (err) {
                console.error(`Failed to export ${url}:`, err);
            }
            finally {
                await page.close(); // Close the page, keep the browser
            }

        }));
    }
    await browser.close();
}