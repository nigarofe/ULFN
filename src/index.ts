import 'katex/dist/katex.min.css';

const stylesheets = import.meta.glob('./styles/*.css', { eager: true });
if (!Object.keys(stylesheets).length) { throw new Error('No stylesheets found in /src/styles'); }

switch (window.location.pathname) {
    case '/documentSelector':
        await import('./documentSelector.ts');
        break;
    case '/documentViewer':
        await import('./documentViewer.ts');
        break;
    case '/documentValidator':
        await import('./documentValidator.ts');
        break;
    case '/documentsPlaylists':
        await import('./documentsPlaylists.ts');
        break;
    default:
        window.history.replaceState(null, '', '/documentsPlaylists');
        await import('./documentsPlaylists.ts');
        break;
}
