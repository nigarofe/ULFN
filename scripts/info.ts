import fs from 'node:fs';
import path from 'path';
import matter from 'gray-matter';

import { DOCUMENTS_DIR } from './../config'

const classificationCounts: Record<string, number> = {};

const documents = fs.readdirSync(DOCUMENTS_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => {
        return {
            rawContent: fs.readFileSync(path.join(DOCUMENTS_DIR, file), 'utf-8'),
            id: parseInt(path.basename(file, '.md'))
        };
    });

console.log(`Number of documents: ${documents.length}`);

const requiredFields = ['Classification', 'Discipline', 'Source', 'Description'];

documents.forEach((doc, _index) => {
    const { data } = matter(doc.rawContent);

    // Check if they all contain the required YAML fields
    const missingFields = requiredFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
        console.log(`Document ${doc.id} is missing fields: ${missingFields.join(', ')}`);
    }

    // Check if the documents with "Classification" equal to "Deterministic Problem"
    // have the headings "# Proposition", "# Step-by-step", "# Answer", "# Attempts"
    if (data['Classification'] === 'Deterministic Problem') {
        const requiredHeadings = ['# Proposition', '# Step-by-step', '# Answer', '# Attempts'];
        const missingHeadings = requiredHeadings.filter(heading => !doc.rawContent.includes(heading));
        if (missingHeadings.length > 0) {
            console.log(`Document ${doc.id} is missing headings: ${missingHeadings.join(', ')}`);
        }
    }


    // Check if the documents with "Classification" equal to "Keywords Exercise"
    // have the headings "# Student Prompt", "# Iterations", "# Expected Keywords", "# Attempts"
    if (data['Classification'] === 'Keywords Exercise') {
        const requiredHeadings = ['# Student Prompt', '# Notes', '# Iterations', '# Expected Keywords', '# Attempts'];
        const missingHeadings = requiredHeadings.filter(heading => !doc.rawContent.includes(heading));
        if (missingHeadings.length > 0) {
            console.log(`Document ${doc.id} is missing headings: ${missingHeadings.join(', ')}`);
        }
    }



    // Count the total amount of documents of each "Exercise Classification"
    const classification = data['Classification'] || 'Unknown';
    classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
});

console.log('\nDocument classification counts:');
for (const [classification, count] of Object.entries(classificationCounts)) {
    console.log(`- ${classification}: ${count}`);
}



console.log('\nDocument validation completed.');
