// Load all stylesheets at the /src/styles folder.
const stylesheetLoaders = import.meta.glob('./styles/*.css');
const stylesheetEntries = Object.entries(stylesheetLoaders);
if (!stylesheetEntries.length) { throw new Error('No stylesheets found in /src/styles'); }
stylesheetEntries.forEach(([, loadStylesheet]) => { loadStylesheet(); });


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
        window.location.pathname = '/documentsPlaylists';
        break;
}


const updateTextureScale = () => {
    const body = document.body;
    if (!body) { return; }

    const baseSize = getComputedStyle(body).getPropertyValue('--page-bg-size-base').trim();
    if (!baseSize) { return; }

    const baseValue = parseFloat(baseSize);
    if (Number.isNaN(baseValue)) { return; }

    const baseUnit = baseSize.replace(/[0-9.\s]/g, '') || 'px';
    const ratio = window.devicePixelRatio || 1;
    const scaledValue = baseValue / ratio;

    body.style.setProperty('--page-bg-size', `${scaledValue}${baseUnit}`);
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
