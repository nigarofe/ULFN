// npx tsx scripts/normalize-hr-spacing.ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { DOCUMENTS_DIR } from "../config.ts";

function isDashRule(line: string): boolean {
    return line.trim() === "---";
}

function isBlank(line: string): boolean {
    return line.trim() === "";
}

function normalizeRules(content: string): string {
    const eol = content.includes("\r\n") ? "\r\n" : "\n";
    const endsWithEol = content.endsWith(eol);
    const lines = content.split(/\r?\n/);

    let yamlStart = -1;
    let yamlEnd = -1;

    // Leave top-of-file YAML front matter untouched.
    if (lines.length > 0 && isDashRule(lines[0].replace(/^\uFEFF/, ""))) {
        yamlStart = 0;
        for (let i = 1; i < lines.length; i += 1) {
            if (isDashRule(lines[i])) {
                yamlEnd = i;
                break;
            }
        }
    }

    const out: string[] = [];
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const inYaml = yamlStart !== -1 && yamlEnd !== -1 && i >= yamlStart && i <= yamlEnd;

        if (!inYaml && isDashRule(line)) {
            if (out.length > 0 && !isBlank(out[out.length - 1])) {
                out.push("");
            }

            out.push(line);

            const nextLine = lines[i + 1];
            if (i < lines.length - 1 && !isBlank(nextLine ?? "")) {
                out.push("");
            }
            continue;
        }

        out.push(line);
    }

    let result = out.join(eol);
    if (endsWithEol && !result.endsWith(eol)) {
        result += eol;
    }
    return result;
}

function main(): void {
    const files = readdirSync(DOCUMENTS_DIR).filter((name) => name.endsWith(".md"));
    let changed = 0;

    for (const name of files) {
        const filePath = join(DOCUMENTS_DIR, name);
        const original = readFileSync(filePath, "utf8");
        const updated = normalizeRules(original);

        if (updated !== original) {
            writeFileSync(filePath, updated, "utf8");
            changed += 1;
            console.log(`updated ${name}`);
        }
    }

    console.log(`done. changed ${changed} of ${files.length} files.`);
}

main();