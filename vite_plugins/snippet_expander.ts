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
                    const content = await fsp.readFile(filePath, 'utf-8');
                    let updatedContent = "";

                    if (content.includes('/timestamp') || content.includes('/ts')) {
                        const isoTimestamp = new Date().toISOString().slice(0, -5) + 'Z';
                        updatedContent = content.replace(/\/timestamp/g, isoTimestamp);
                        updatedContent = updatedContent.replace(/\/ts/g, isoTimestamp);
                    }

                    if (content.includes('/fbe')) {
                        const psaaContent = `# Proposition\n\n\n# Notes\n\n\n# Step-by-step\n\n\n# Answer\n\n\n# Attempts\n`;
                        updatedContent = content.replace(/\/fbe/g, psaaContent);
                    }

                    if (content.includes('/keywords')) {
                        const keywordsContent = `# Student Prompt\n\n\n# Notes\n\n\n# Iterations\n\n\n# Expected Keywords\n\n\n# Attempts\n`;
                        updatedContent = content.replace(/\/keywords/g, keywordsContent);
                    }

                    // Only write to the disk if a macro was actually found and replaced
                    if (updatedContent !== "") {
                        await fsp.writeFile(filePath, updatedContent, 'utf-8');
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