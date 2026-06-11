import katex from 'katex';

// Math rendering. Regex uses half of the time than something like Cheerio
const mathCache = new Map<string, string>();

// Fast, lightweight HTML entity decoder to replace Cheerio's .text()
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// Matches <span class="math inline">...</span> or <div class="math display">...</div>
// Group 1: Tag name (span|div)
// Group 2: Attributes (to check for "display")
// Group 3: The inner math text
const MATH_REGEX = /<(span|div)\s+([^>]*class="[^"]*\bmath\b[^"]*"[^>]*)>([\s\S]*?)<\/\1>/gi;

export function renderMath(html: string): string {
    // Fast path: if there's no math class, return immediately
    if (!html.includes('math')) return html;

    return html.replace(MATH_REGEX, (match, _tag, attrs, innerHtml) => {
        let texSource = innerHtml.trim();
        if (!texSource) return match;

        const isDisplayMode = attrs.includes('display');

        // Decode HTML entities that Pandoc might have escaped (e.g., x &lt; y)
        texSource = decodeHtmlEntities(texSource);

        // Strip Pandoc delimiters
        if (texSource.startsWith('$$') && texSource.endsWith('$$')) {
            texSource = texSource.slice(2, -2);
        } else if (texSource.startsWith('$') && texSource.endsWith('$')) {
            texSource = texSource.slice(1, -1);
        } else if (texSource.startsWith('\\(') && texSource.endsWith('\\)')) {
            texSource = texSource.slice(2, -2); // Handle \( ... \)
        } else if (texSource.startsWith('\\[') && texSource.endsWith('\\]')) {
            texSource = texSource.slice(2, -2); // Handle \[ ... \]
        }
        
        texSource = texSource.trim();

        // Check Cache
        const cacheKey = `${isDisplayMode ? 'D' : 'I'}:${texSource}`;
        let renderedHtml = mathCache.get(cacheKey);

        if (!renderedHtml) {
            renderedHtml = katex.renderToString(texSource, {
                displayMode: isDisplayMode,
                throwOnError: false,
                fleqn: false,
                output: 'html'
            });
            mathCache.set(cacheKey, renderedHtml);
        }

        return renderedHtml;
    });
}