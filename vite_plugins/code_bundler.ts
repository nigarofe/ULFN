import type { Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';

const bundleConfig = {
    bundled_code_1: {
        files: [
            'index.html'
        ]
    }
};
const BUNDLE_OUTPUT_DIR = path.join(process.cwd(), 'bundled_code');
if (!fs.existsSync(BUNDLE_OUTPUT_DIR)) fs.mkdirSync(BUNDLE_OUTPUT_DIR);

export function code_bundler(): Plugin {
    return {
        name: 'code_bundler',
        buildStart() {
            Object.entries(bundleConfig).forEach(([bundleName, { files }]) => {
                let bundledCode = '';

                files.forEach((relativePath) => {
                    const absolutePath = path.resolve(process.cwd(), relativePath);
                    if (!fs.existsSync(absolutePath)) { throw new Error(`File not found: ${absolutePath}`); }
                    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
                    bundledCode += `// --- START OF FILE: ${relativePath} ---\n${fileContent}\n\n`;
                });

                fs.writeFileSync(path.join(BUNDLE_OUTPUT_DIR, `${bundleName}.txt`), bundledCode);
                console.log(`[${new Date().toLocaleTimeString()}] ✅ ${bundleName}.txt ready!`);
            });
        }
    }
}