import fs from 'fs';

import { logMessage } from '../scripts/logger';
import {
    DOCUMENT_CARD_TEMPLATE_PATH,
    DOCUMENT_HEADER_TEMPLATE_PATH,
    DOCUMENT_VIEWER_TEMPLATE_PATH,
    DOCUMENTS_DIR,
    EXPORTS_DIR,
    FOOTER_TEMPLATE_PATH,
    PANDOC_SERVER_URL,
    ULF_SERVER_URL,
    VITE_SERVER_URL
} from '../config';

let hasError = false;

const recordError = (message: string) => {
    logMessage(`ERROR: ${message}`);
    hasError = true;
};

const requireFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
        recordError(`File not found: ${filePath}`);
        return;
    }
    if (!fs.statSync(filePath).isFile()) {
        recordError(`Expected file: ${filePath}`);
    }
};

const requireDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        return;
    }
};

const requireUrl = (value: string, name: string) => {
    try {
        new URL(value);
    } catch {
        recordError(`Invalid URL for ${name}: ${value}`);
    }
};

requireFile(FOOTER_TEMPLATE_PATH);
requireFile(DOCUMENT_CARD_TEMPLATE_PATH);
requireFile(DOCUMENT_VIEWER_TEMPLATE_PATH);
requireFile(DOCUMENT_HEADER_TEMPLATE_PATH);

requireDir(EXPORTS_DIR);
requireDir(DOCUMENTS_DIR);

requireUrl(PANDOC_SERVER_URL, 'PANDOC_SERVER_URL');
requireUrl(ULF_SERVER_URL, 'ULF_SERVER_URL');
requireUrl(VITE_SERVER_URL, 'VITE_SERVER_URL');

// Check if pandoc server is running by sending a test request
await fetch(PANDOC_SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ text: 'Test', from: 'markdown', to: 'html' })
}).catch(() => {
    logMessage('ERROR: Failed to connect to the Pandoc server. Is the Pandoc server running?');
    hasError = true;
});

if (hasError) {
    console.error(`Fail-Fast Check Failed: Check the logs for details.`);
    process.exit(1);
}