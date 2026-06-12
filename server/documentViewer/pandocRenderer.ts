import { PANDOC_SERVER_URL } from '../../config';
import { logMessage } from '../../scripts/logger';

// Pandoc server approach is ~2x faster than child_process approach
export async function pandocRenderWithServer(processedMarkdown: string): Promise<string> {
    const response = await fetch(PANDOC_SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            text: processedMarkdown,
            from: 'markdown',
            to: 'html',
            'standalone': true,
            'number-sections': true,
            'table-of-contents': true,
            'html-math-method': 'katex',
            'template': '<div id="TOC" class="double-line-bottom">$toc$</div> $body$'
            /*
            The standalone option is necessary for the table of contents. 
            However, it also wraps the output to generate a full HTML document.
            So the template is used to ensure the output includes only the TOC and body content
            */
        })
    }).catch(error => {
        logMessage(`ERROR: Failed to connect to the Pandoc server. Is the Pandoc server running? ${error.message}`);
        console.error('ERROR: Check the logs for details');
        return new Response(JSON.stringify({ output: `<div class="error">Error rendering document: ${error.message}. Is the Pandoc server running?</div>` }), { status: 500 });
    });

    const data = await response.json() as { output?: string };
    return data.output || 'Error at pandocRenderWithServer.';
}
