const pageScript = document.createElement('script');
pageScript.type = 'module';

switch (window.location.pathname) {
    case '/documentSelector':
        pageScript.src = '/src/documentSelector.ts';
        break;
    case '/documentViewer':
        pageScript.src = '/src/documentViewer.ts';
        break;
    case '/documentValidator':
        pageScript.src = '/src/documentValidator.ts';
        break;
    case '/documentsPlaylists':
        pageScript.src = '/src/documentsPlaylists.ts';
        break;
    default:
        window.location.pathname = '/documentsPlaylists';
        break;
}

document.head.appendChild(pageScript);

// Load all stylesheets at the /src/styles folder.
const stylesheetLoaders = import.meta.glob('./styles/*.css');
const stylesheetEntries = Object.entries(stylesheetLoaders);
if (!stylesheetEntries.length) { throw new Error('No stylesheets found in /src/styles'); }
stylesheetEntries.forEach(([, loadStylesheet]) => { loadStylesheet(); });

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
