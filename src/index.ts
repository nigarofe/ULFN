import 'katex/dist/katex.min.css';

// Load all stylesheets at the /src/styles folder.
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


const updateTextureScale = () => {
    const root = document.documentElement;

    const baseSize = getComputedStyle(root).getPropertyValue('--page-bg-size-base').trim() || '182px';
    if (!baseSize) { return; }

    const baseValue = parseFloat(baseSize);
    if (Number.isNaN(baseValue)) { return; }

    const baseUnit = baseSize.replace(/[0-9.\s]/g, '') || 'px';
    const ratio = window.devicePixelRatio || 1;
    const scaledValue = baseValue / ratio;

    root.style.setProperty('--page-bg-size', `${scaledValue}${baseUnit}`);
};

const initTextureScale = () => {
    updateTextureScale();
    window.addEventListener('resize', updateTextureScale);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextureScale);
} else {
    initTextureScale();
}
