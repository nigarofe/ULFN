export function applyPostProcessors(contentHTML: string, classification: string): string {
    switch (classification) {
        case 'Multiple Choice Exercise':
            return postProcessorMultipleChoiceExercise(contentHTML);
        case 'Cloze Exercise':
            return postProcessorClozeExercise(contentHTML);
        case 'Keywords Exercise':
            return postProcessorKeywordsExercise(contentHTML);
        default:
            return contentHTML;
    }
}





















function postProcessorClozeExercise(html: string): string {
    const clozeRegex = /<strong>\{([^}]+)\}<\/strong>/g;

    return html.replace(clozeRegex, (match, answers) => {
        if (typeof match !== 'string') throw new Error("Cloze match must be a string.");
        if (typeof answers !== 'string') throw new Error("Cloze answers must be a string.");
        const answerList = answers.split('|').map(ans => ans.trim().toLowerCase());

        const jsonAnswers = JSON.stringify(answerList).replace(/"/g, '&quot;');

        return `<input 
                    type="text" 
                    class="cloze-input" 
                    data-answers="${jsonAnswers}"
                    title="${answers.replace(/\|/g, ', ')}"
                />`;
    });
}




















function postProcessorMultipleChoiceExercise(html: string): string {
    const listRegex = /<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    const listItemRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    const pandocCheckboxRegex = /<input\b[^>]*type=["']?checkbox["']?[^>]*>/i;
    const checkedAttrRegex = /\bchecked(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/i;

    const processedHtml = html.replace(listRegex, (match, _tag, listContent) => {
        const matches: string[] = [];
        let itemMatch;

        listItemRegex.lastIndex = 0;

        while ((itemMatch = listItemRegex.exec(listContent)) !== null) {
            const itemHtml = itemMatch[1].trim();
            let isChecked = false;
            let content = '';

            const pandocCheckboxMatch = itemHtml.match(pandocCheckboxRegex);
            if (pandocCheckboxMatch) {
                isChecked = checkedAttrRegex.test(pandocCheckboxMatch[0]);
                content = itemHtml
                    .replace(/<label\b[^>]*>/gi, '')
                    .replace(/<\/label>/gi, '')
                    .replace(/<input\b[^>]*type=["']?checkbox["']?[^>]*>/gi, '')
                    .trim();
            }

            if (!pandocCheckboxMatch) {
                continue;
            }

            const className = isChecked ? "mc-option shouldBeSelected" : "mc-option";

            matches.push(`
                <button class="${className}">
                    <span class="option-text">${content}</span>
                </button>`.trim());
        }

        // If this specific list didn't have MC syntax, return it untouched
        if (matches.length === 0) { return match; }

        // Shuffle the options for this specific question
        for (let i = matches.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [matches[i], matches[j]] = [matches[j], matches[i]];
        }

        // Wrap the shuffled buttons in the container
        return `<div class="mc-container">${matches.join('')}</div>`;
    });

    return processedHtml;
}













/*
- The postProcessorKeywordsExercise() shall have a score for each category of expected keywords.
- The categories of expected keywords shall be defined as level 2 headings inside the "# Expected Keywords" heading.
- The total and category score for each iteration shall be displayed above it.
- The postProcessorKeywordsExercise() shall support headings inside the iterations section
*/


type SectionInfo = { content: string; level: number | null; startIndex: number; endIndex: number };
type RegexRule = { requiredCount: number; words: string[] };
type CategoryRuleSet = { title: string; rules: RegexRule[]; requiredTotal: number };

function extractSection(sourceHtml: string, sectionTitle: string): SectionInfo {
    const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titlePattern = escapeRegExp(sectionTitle);
    const headingRegex = new RegExp(`<h([1-6])[^>]*>[\\s\\S]*?${titlePattern}[\\s\\S]*?<\\/h\\1>`, 'i');
    const match = headingRegex.exec(sourceHtml);
    if (!match) {
        return { content: '', level: null, startIndex: -1, endIndex: -1 };
    }

    const level = parseInt(match[1], 10);
    const startIndex = match.index + match[0].length;
    const nextHeadingRegex = /<h([1-6])[^>]*>/gi;
    nextHeadingRegex.lastIndex = startIndex;
    let endIndex = sourceHtml.length;
    let nextMatch;

    while ((nextMatch = nextHeadingRegex.exec(sourceHtml)) !== null) {
        const nextLevel = parseInt(nextMatch[1], 10);
        if (nextLevel <= level) {
            endIndex = nextMatch.index;
            break;
        }
    }

    return { content: sourceHtml.slice(startIndex, endIndex).trim(), level, startIndex, endIndex };
};

function stripTags(value: string): string {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function parseRulesFromHtml(sectionHtml: string): { rules: RegexRule[]; requiredTotal: number } {
    const rules: RegexRule[] = [];
    let totalRequired = 0;
    const listItemRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    const inlineRuleRegex = /-\s*(\d+)\s+(.+?)(?=(?:\s+-\s*\d+\s+)|$)/g;
    let itemMatch;

    while ((itemMatch = listItemRegex.exec(sectionHtml)) !== null) {
        const itemText = stripTags(itemMatch[1]);
        const ruleMatch = /^(\d+)\s+(.+)$/.exec(itemText);
        if (!ruleMatch) {
            continue;
        }

        const requiredCount = parseInt(ruleMatch[1], 10);
        const words = ruleMatch[2]
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0)
            .sort((a, b) => b.length - a.length);
        if (words.length > 0) {
            rules.push({ requiredCount, words });
            totalRequired += requiredCount;
        }
    }

    const htmlWithoutListItems = sectionHtml.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, ' ');
    const textWithoutListItems = stripTags(htmlWithoutListItems);

    while ((itemMatch = inlineRuleRegex.exec(textWithoutListItems)) !== null) {
        const requiredCount = parseInt(itemMatch[1], 10);
        const words = itemMatch[2]
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0)
            .sort((a, b) => b.length - a.length);
        if (words.length > 0) {
            rules.push({ requiredCount, words });
            totalRequired += requiredCount;
        }
    }

    return { rules, requiredTotal: totalRequired };
}

function extractCategorySections(sectionHtml: string, categoryLevel: number): { title: string; content: string }[] {
    const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    const allHeadings: { level: number; title: string; index: number; endIndex: number; order: number }[] = [];
    let match;
    let order = 0;

    while ((match = headingRegex.exec(sectionHtml)) !== null) {
        allHeadings.push({
            level: parseInt(match[1], 10),
            title: stripTags(match[2]),
            index: match.index,
            endIndex: match.index + match[0].length,
            order
        });
        order += 1;
    }

    const categoryHeadings = allHeadings.filter(h => h.level === categoryLevel);
    if (categoryHeadings.length === 0) {
        return [];
    }

    return categoryHeadings.map((heading, index) => {
        let endIndex = sectionHtml.length;
        for (let i = heading.order + 1; i < allHeadings.length; i++) {
            if (allHeadings[i].index > heading.index && allHeadings[i].level <= categoryLevel) {
                endIndex = allHeadings[i].index;
                break;
            }
        }

        return {
            title: heading.title || `Category ${index + 1}`,
            content: sectionHtml.slice(heading.endIndex, endIndex).trim()
        };
    });
}

function buildWordRegex(word: string): RegExp {
    const escapedWord = word.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${escapedWord})(?=[^\\p{L}\\p{N}]|$)(?![^<]*>)`, 'giu');
}

function countWordMatches(text: string, word: string): number {
    const wordRegex = buildWordRegex(word);
    const matches = text.match(wordRegex);
    return matches ? matches.length : 0;
}

function countRuleMatches(text: string, rule: RegexRule): number {
    let matchesForRule = 0;
    rule.words.forEach(word => {
        matchesForRule += countWordMatches(text, word);
    });
    return Math.min(matchesForRule, rule.requiredCount);
}


function postProcessorKeywordsExercise(html: string): string {
    // 1. Extract the Iterations section
    const iterationsSection = extractSection(html, 'Iterations');
    const iterationsHeadingLevel = iterationsSection.level;
    if (!iterationsSection.content || iterationsSection.startIndex < 0 || iterationsSection.endIndex < 0) {
        console.warn("Warning: 'Iterations' section not found.");
        return html;
    }

    // 2. Extract the Expected Keywords section
    const regexSection = extractSection(html, 'Expected Keywords');
    const regexSectionHtml = regexSection.content;

    if (regexSectionHtml) {
        const expectedKeywordsLevel = regexSection.level ?? 1;
        const categoryLevel = expectedKeywordsLevel + 1;
        const categorySections = extractCategorySections(regexSectionHtml, categoryLevel);
        const categories: CategoryRuleSet[] = [];

        if (categorySections.length > 0) {
            categorySections.forEach(section => {
                const parsedRules = parseRulesFromHtml(section.content);
                categories.push({
                    title: section.title,
                    rules: parsedRules.rules,
                    requiredTotal: parsedRules.requiredTotal
                });
            });
        } else {
            const parsedRules = parseRulesFromHtml(regexSectionHtml);
            if (parsedRules.rules.length > 0) {
                categories.push({
                    title: 'Expected Keywords',
                    rules: parsedRules.rules,
                    requiredTotal: parsedRules.requiredTotal
                });
            }
        }

        if (categories.length === 0) {
            return html;
        }

        const allRules = categories.flatMap(category => category.rules);
        const totalRequired = categories.reduce((sum, category) => sum + category.requiredTotal, 0);
        if (totalRequired === 0 || allRules.length === 0) {
            return html;
        }

        const iterationsRawHtml = html.slice(iterationsSection.startIndex, iterationsSection.endIndex);
        const iterationHeadingLevel = (iterationsHeadingLevel ?? 0) + 1;
        const iterationHeadingRegex = /<h([1-6])[^>]*>[\s\S]*?<\/h\1>/gi;
        const iterationHeadings: { level: number; start: number; end: number; html: string }[] = [];
        let headingMatch;

        while ((headingMatch = iterationHeadingRegex.exec(iterationsRawHtml)) !== null) {
            iterationHeadings.push({
                level: parseInt(headingMatch[1], 10),
                start: headingMatch.index,
                end: headingMatch.index + headingMatch[0].length,
                html: headingMatch[0]
            });
        }

        const iterationStarts = iterationHeadings.filter(h => h.level === iterationHeadingLevel);
        if (iterationStarts.length === 0) {
            return html;
        }

        let updatedIterationsHtml = '';
        let cursor = 0;

        for (let i = 0; i < iterationStarts.length; i++) {
            const currentHeading = iterationStarts[i];
            const nextStart = i + 1 < iterationStarts.length ? iterationStarts[i + 1].start : iterationsRawHtml.length;
            updatedIterationsHtml += iterationsRawHtml.slice(cursor, currentHeading.start);

            const headingTag = currentHeading.html;
            const bodyHtml = iterationsRawHtml.slice(currentHeading.end, nextStart);

            let highlightedHtml = bodyHtml;
            allRules.forEach(rule => {
                rule.words.forEach(word => {
                    const wordRegex = buildWordRegex(word);
                    const matches = [...highlightedHtml.matchAll(wordRegex)];
                    if (matches.length > 0) {
                        highlightedHtml = highlightedHtml.replace(
                            wordRegex,
                            `<span style="color: green; font-weight: bold; background-color: #e6ffe6; padding: 0 2px; border-radius: 3px;">$1</span>`
                        );
                    }
                });
            });

            const categoryScores = categories.map(category => {
                const categoryMatchCount = category.rules.reduce(
                    (sum, rule) => sum + countRuleMatches(bodyHtml, rule),
                    0
                );

                return {
                    title: category.title,
                    matchCount: categoryMatchCount,
                    requiredTotal: category.requiredTotal
                };
            });

            const totalMatchCount = categoryScores.reduce((sum, category) => sum + category.matchCount, 0);
            const isComplete = totalMatchCount >= totalRequired && totalRequired > 0;
            const totalScoreClass = isComplete ? 'keywords-score keywords-score--complete' : 'keywords-score';
            const totalScoreHtml = `<div class="${totalScoreClass}">Total Score: ${totalMatchCount} / ${totalRequired}</div>`;
            const categoryScoreHtml = categoryScores
                .map(category => `<div class="keywords-category-score">${category.title}: ${category.matchCount} / ${category.requiredTotal}</div>`)
                .join('');
            const scoreBlockHtml = `<div class="keywords-score-block">${totalScoreHtml}${categoryScoreHtml}</div>`;

            updatedIterationsHtml += `${headingTag}${scoreBlockHtml}${highlightedHtml}`;
            cursor = nextStart;
        }

        updatedIterationsHtml += iterationsRawHtml.slice(cursor);

        return html.slice(0, iterationsSection.startIndex)
            + updatedIterationsHtml
            + html.slice(iterationsSection.endIndex);
    }
    return html;
}