import * as path from 'path';
import * as fsp from 'fs/promises';
import type { Plugin } from 'vite';

const WATCH_DIR = path.resolve(process.cwd(), 'public');

export function snippet_expander(): Plugin {
    return {
        name: 'snippet_expander',
        configureServer(server) {
            console.log(`👀 Watching for changes in ${WATCH_DIR}`);

            async function processFile(filePath: string): Promise<void> {
                // Only process files inside our target directory
                if (!filePath.startsWith(WATCH_DIR)) return;

                try {
                    let content = await fsp.readFile(filePath, 'utf-8');
                    let hasChanges = false;

                    if (/\/ts\b/.test(content)) {
                        const isoTimestamp = new Date().toISOString().slice(0, -5) + 'Z';
                        content = content.replace(/\/ts\b/g, isoTimestamp);
                        hasChanges = true;
                    }

                    if (/\/fbe\b/.test(content)) {
                        const psaaContent = `# Proposition\n\n\n# Notes\n\n\n# Step-by-step\n\n\n# Answer\n\n\n# Attempts\n`;
                        content = content.replace(/\/fbe\b/g, psaaContent);
                        hasChanges = true;
                    }

                    if (/\/keywords\b/.test(content)) {
                        const keywordsContent = `# Student Prompt\n\n\n# Notes\n\n\n# Iterations\n\n\n# Expected Keywords\n\n\n# Attempts\n`;
                        content = content.replace(/\/keywords\b/g, keywordsContent);
                        hasChanges = true;
                    }

                    // Only write to the disk if a macro was actually found and replaced
                    if (hasChanges) {
                        await fsp.writeFile(filePath, content, 'utf-8');
                        console.log(`✅ Updated: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing file ${filePath}:`, error);
                }
            }

            server.watcher
                .on('add', (filePath) => processFile(filePath))
                .on('change', (filePath) => processFile(filePath));
        }
    };
}