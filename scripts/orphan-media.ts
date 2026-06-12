import fs from 'node:fs';
import path from 'path';

import { DOCUMENTS_DIR } from './../config';

const MEDIA_DIR = path.resolve(process.cwd(), 'public', 'media');

// Collect all media filenames
const mediaFiles = new Set(fs.readdirSync(MEDIA_DIR));

// Collect all media filenames referenced across all documents
const referencedMedia = new Set<string>();

const documentFiles = fs.readdirSync(DOCUMENTS_DIR).filter(f => f.endsWith('.md'));

for (const docFile of documentFiles) {
    const content = fs.readFileSync(path.join(DOCUMENTS_DIR, docFile), 'utf-8');

    // Match patterns like: ../media/filename.ext
    const matches = content.matchAll(/\.\.\/media\/([^\s"'\)]+)/g);
    for (const match of matches) {
        referencedMedia.add(match[1]);
    }
}

// Find media files not referenced in any document
const orphans = [...mediaFiles].filter(f => !referencedMedia.has(f));

if (orphans.length === 0) {
    console.log('No orphaned media files found.');
} else {
    console.log(`Found ${orphans.length} orphaned media file(s):\n`);
    for (const file of orphans.sort()) {
        console.log(`  ${file}`);
    }
}
