const body = document.querySelector('body') as HTMLElement;
document.title = 'Documents Playlists';

async function triggerExport(folder?: string) {
    const url = folder
        ? `/api/exportPlaylists?folder=${encodeURIComponent(folder)}`
        : '/api/exportPlaylists';
    const response = await fetch(url);
    return response.json();
}

async function renderPlaylists() {
    const response = await fetch('/api/getPlaylistsBody');
    const data = await response.json();
    body.innerHTML = data.html;
}

document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest('button[data-export]') as HTMLButtonElement | null;
    if (!button) { return; }

    const { export: exportType, folder } = button.dataset;
    if (exportType === 'all') {
        void triggerExport();
        return;
    }

    if (exportType === 'selected-folder') {
        const select = document.querySelector('select[data-folder-select]') as HTMLSelectElement | null;
        const selectedFolder = select?.value?.trim();
        if (selectedFolder) {
            void triggerExport(selectedFolder);
        }
        return;
    }

    if (exportType === 'folder' && folder) {
        void triggerExport(folder);
    }
});

renderPlaylists();