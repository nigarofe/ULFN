import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

const MEDIA_DIR = path.resolve(process.cwd(), 'public', 'media');

const files = fs.readdirSync(MEDIA_DIR);
const targets = files.filter(f => /\.(png|jpe?g)$/i.test(f));

if (targets.length === 0) {
    console.log('No PNG or JPG files found.');
    process.exit(0);
}

console.log(`Optimizing ${targets.length} file(s):\n`);

let done = 0;
let failed = 0;

for (const file of targets) {
    const srcPath = path.join(MEDIA_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const isJpg = ext === '.jpg' || ext === '.jpeg';
    const destName = `${baseName}.jpg`;
    const destPath = path.join(MEDIA_DIR, destName);
    const label = isJpg ? destName : `${file} → ${destName}`;

    process.stdout.write(`  ${label} ... `);

    try {
        if (isJpg) {
            // Re-compress in-place via a temp file (sharp can't read & write same path)
            const tmp = path.join(os.tmpdir(), `ulfn_${destName}`);
            await sharp(srcPath)
                .resize(1920, null, { withoutEnlargement: true })
                .jpeg({ quality: 85, mozjpeg: true })
                .toFile(tmp);
            fs.renameSync(tmp, srcPath);
        } else {
            // PNG → JPG: flatten transparency, convert, delete original
            await sharp(srcPath)
                .resize(1920, null, { withoutEnlargement: true })
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .jpeg({ quality: 90, mozjpeg: true })
                .toFile(destPath);
            fs.unlinkSync(srcPath);
        }

        const before = fs.statSync(isJpg ? srcPath : destPath).size;
        console.log(`✓`);
        done++;
    } catch (err) {
        console.log(`✗ (${(err as Error).message})`);
        failed++;
    }
}

console.log(`\nDone. Optimized: ${done}, Failed: ${failed}.`);
