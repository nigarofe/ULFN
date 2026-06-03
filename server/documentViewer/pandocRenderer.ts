import { PANDOC_SERVER_URL } from '../../config';
import { logMessage } from '../../scripts/logger';

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





// For comparison purposes only, not used in the current implementation
/* Performance comparison between child_process and server approach:
    For playlist=236,237,238,243,245,246
    - pandocRenderWithServer: average of 2 tests = 530ms
    - pandocRenderWithProcess: average of 2 tests = 1129ms
*/
// async function pandocRenderWithProcess(processedMarkdown: string): Promise<string> {
//     const { exec } = await import('node:child_process');
//     return new Promise((resolve, reject) => {
//         const pandocProcess = exec('pandoc -f markdown -t html --number-sections --katex --table-of-contents --standalone', (error, stdout, stderr) => {
//             if (error) {
//                 console.error('Pandoc process error:', error);
//                 reject(new Error(`Pandoc process failed: ${error.message}`));
//                 return;
//             }
//             if (stderr) {
//                 console.error('Pandoc process stderr:', stderr);
//             }

//             const bodyMatch = stdout.match(/<body[^>]*>([\s\S]*?)<\/body>/i); // Regex is ~36% faster than Cheerio
//             const output = bodyMatch ? bodyMatch[1] : 'Regex parsing failed: No body tag found.';
//             resolve(output);
//         });
//         if (!pandocProcess.stdin) {
//             reject(new Error('Pandoc process failed: stdin not available.'));
//             return;
//         }

//         pandocProcess.stdin.write(processedMarkdown);
//         pandocProcess.stdin.end();
//     });
// }
