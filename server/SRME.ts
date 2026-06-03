import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { type SRMEEntry } from './SRME.schema';
import { logMessage } from '../scripts/logger';
import { DOCUMENTS_DIR, DISABLED_DISCIPLINES } from '../config.js';






export function generateSRME(documentId?: number) {
    let files: string[];
    
    if (Number.isInteger(documentId)) {
        logMessage(`INFO: SRME generation started for document ID: ${documentId}`);
        const fileName = `${documentId}.md`;
        const filePath = path.join(DOCUMENTS_DIR, fileName);
        files = fs.existsSync(filePath) ? [fileName] : [];
    } else {
        logMessage(`INFO: SRME generation started for all documents.`);
        files = fs.readdirSync(DOCUMENTS_DIR).filter((f: string) => f.endsWith('.md'));
    }
    
    const data: SRMEEntry[] = files.map((file: string): SRMEEntry | null => {
        const content = fs.readFileSync(path.join(DOCUMENTS_DIR, file), 'utf-8');
        const { data: metadata } = matter(content);

        const classification = metadata['Classification'] as string;
        const discipline = metadata['Discipline'] as string;
        const source = metadata['Source'] as string;
        const description = metadata['Description'] as string;

        if (DISABLED_DISCIPLINES.includes(discipline)) { return null; }

        const attempts = getAttemptsFromMd(content);
        const srme = calculateSRME(attempts);

        return {
            'ID': Number(path.parse(file).name),
            'Classification': classification,
            'Discipline': discipline,
            'Source': source,
            'Description': description,
            'SRME': srme,
            'Attempts': attempts
        };
    })
        .filter((entry): entry is SRMEEntry => entry !== null)
        .sort((a, b) => a.ID - b.ID);


    // Writing even if there are no changes is more performant than checking for differences
    // fs.writeFileSync(SRME_PATH, JSON.stringify(data, null, 2)); // Debug

    logMessage(`INFO: SRME generation completed with ${data.length} entries`);
    return data;
}





/* 
The md file has a section like this:

```markdown
# Attempts
2024-11-07T06:00:00Z 0
2025-01-24T06:00:00Z 1
2025-02-20T06:00:00Z 1
```

The idea of the `getAttemptsFromMd` function is to parse this section and extract the timestamp and code pairs into an array of objects. Each object will have a `timestamp` property (a string) and a `code` property (a number).
*/

function getAttemptsFromMd(content: string): SRMEEntry['Attempts'] {
    const attempts: Array<{ Timestamp: string; Code: number }> = [];

    // 1. Find the content under the "## Attempts" header
    // This regex looks for # Attempts and captures everything until the next header (##) or end of string
    const sectionMatch = content.match(/# Attempts\s*([\s\S]*?)(?=\n##|$)/);

    if (!sectionMatch || !sectionMatch[1]) { return []; }

    const sectionContent = sectionMatch[1].trim();

    // 2. Parse each line for the pattern: [ISO Timestamp] [Number]
    // Regex breakdown:
    // (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z) -> Captures the ISO timestamp
    // \s+                                   -> One or more spaces
    // (\d+)                                 -> Captures the digit code
    const lineRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(\d+)/g;
    let match;

    while ((match = lineRegex.exec(sectionContent)) !== null) {
        attempts.push({ 'Timestamp': match[1], 'Code': parseInt(match[2], 10) });
    }

    // Order attempts by timestamp ascending
    attempts.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

    return attempts;
}





function calculateSRME(attempts: SRMEEntry['Attempts']): SRMEEntry['SRME'] {
    // The arrays of attempts are already ordered by timestamp ascending
    const currentDate = new Date();

    const totalAttempts = attempts.length;
    const attemptsWithoutHelp = attempts.filter((attempt: SRMEEntry['Attempts'][number]) => attempt.Code === 1).length;
    const attemptsWithHelp = attempts.filter((attempt: SRMEEntry['Attempts'][number]) => attempt.Code === 0).length;

    let lastAttemptStatus: null | string;
    let daysSinceLastAttempt: null | number;
    let lastMemoryInterval_d: null | number;
    let pmg_d: null | number;
    let pmg_x: null | number;

    if (totalAttempts === 0) {
        lastAttemptStatus = null;
        daysSinceLastAttempt = null;
        lastMemoryInterval_d = null;
        pmg_d = null;
        pmg_x = null;
    } else { // totalAttempts >= 1
        const lastAttemptDate = new Date(attempts[totalAttempts - 1].Timestamp);
        lastAttemptStatus = attempts[totalAttempts - 1].Code === 0 ? 'With Help' : 'Without Help';
        const diffTime = Math.abs(currentDate.getTime() - lastAttemptDate.getTime());
        daysSinceLastAttempt = Number((diffTime / (1000 * 60 * 60 * 24)).toFixed(1));

        if (totalAttempts === 1) {
            lastMemoryInterval_d = null;
            pmg_d = daysSinceLastAttempt;
            pmg_x = null;
        } else {  // totalAttempts >= 2
            if (attempts[totalAttempts - 1].Code === 1) {
                const lastAttemptTime = new Date(attempts[totalAttempts - 1].Timestamp).getTime();
                const secondLastAttemptTime = new Date(attempts[totalAttempts - 2].Timestamp).getTime();
                lastMemoryInterval_d = Number(((lastAttemptTime - secondLastAttemptTime) / (1000 * 60 * 60 * 24)).toFixed(1));
                pmg_d = Number((daysSinceLastAttempt - lastMemoryInterval_d).toFixed(1));
                pmg_x = Number((daysSinceLastAttempt / lastMemoryInterval_d).toFixed(1));
            } else {
                lastMemoryInterval_d = null;
                pmg_d = daysSinceLastAttempt;
                pmg_x = null;
            }
        }
    }

    // Debug
    // if (attempts.some(attempt => attempt.Timestamp.includes('2025-08-14T18:29:57Z'))) {
    //     console.log('Debug Info for PMG-X Calculation:');
    //     console.log('Days Since Last Attempt:', daysSinceLastAttempt);
    //     console.log('Last Memory Interval:', lastMemoryInterval);
    //     console.log('PMG-X Value:', pmg_x);
    // }

    return ({
        'Total Attempts': totalAttempts,
        'Attempts Without Help': attemptsWithoutHelp,
        'Attempts With Help': attemptsWithHelp,
        'LAS': lastAttemptStatus,
        'DSLA': daysSinceLastAttempt,
        'LaMI': lastMemoryInterval_d,
        'PMG-D': pmg_d,
        'PMG-X': pmg_x
    });
}