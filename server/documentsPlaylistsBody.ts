import { PLAYLISTS_CONFIG, type PlaylistsConfig } from '../playlists.config';

const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] ?? char);
}

function buildPlaylistLink(playlist: number[]): string {
    if (!playlist.length) {
        return '#';
    }

    const firstId = playlist[0];
    const playlistParam = playlist.join(',');
    return `/documentViewer?id=${firstId}&playlist=${playlistParam}`;
}

export function getPlaylistsBodyHTML(config: PlaylistsConfig[] = PLAYLISTS_CONFIG): string {
    // const cellStyle = 'style="border: 1px solid #ddd; padding: 8px; vertical-align: top;"';
    // const headerCellStyle = 'style="border: 1px solid #ddd; padding: 10px; text-align: left;"';
    const hasFolders = config.length > 0;
    const folderOptions = hasFolders
        ? config.map((discipline) => {
            const folderLabel = escapeHtml(discipline.folder);
            return `<option value="${folderLabel}">${folderLabel}</option>`;
        }).join('')
        : '<option value="" disabled selected>No folders available</option>';

    let htmlContent = /*html*/ `
        <header class="double-line-around">
            <h1 style="text-align: center; margin: 0 0 1rem; padding: 0; font-size: 2.5rem;">Documents Playlists</h1>
            <span>Browse available documents</span>
        </header>

        <div style="text-align: center; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <select data-folder-select style="padding: .5rem; background: transparent; border: 1px solid black; border-radius: 4px; cursor: pointer;"${hasFolders ? '' : ' disabled'}>
                ${folderOptions}
                </select>
                <button data-export="selected-folder" style="padding: .5rem; cursor: pointer; background: transparent; border: 1px solid black; border-radius: 4px;"${hasFolders ? '' : ' disabled'}>Export Selected Folder</button>
            </div>
            <button data-export="all" style="padding: .5rem; cursor: pointer; background: transparent; border: 1px solid black; border-radius: 4px;">Export All Playlists</button>
        </div>
        
    `;

    if (!hasFolders) {
        htmlContent += `
            <p style="text-align: center; margin: 1.5rem 0;">No folders available.</p>
        `;
        return htmlContent;
    }

    config.forEach(discipline => {
        const folderLabel = escapeHtml(discipline.folder);
        const subfolders = discipline.subfolders ?? [];

        htmlContent += `
            <section style="margin: 0 0 24px;">
                <h2 style="text-align: center;">${folderLabel}</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 0;">
                    <thead>
                        <tr>
                            <th>Playlist</th>
                            <th>Documents</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!subfolders.length) {
            htmlContent += `
                        <tr>
                            <td colspan="2">No playlists</td>
                        </tr>
            `;
        } else {
            subfolders.forEach(playlistData => {
                const subfolderLabel = escapeHtml(playlistData.subfolder);
                const playlistHref = buildPlaylistLink(playlistData.playlist);

                htmlContent += `
                        <tr>
                            <td>
                                <a class="playlist-link" href="${playlistHref}">
                                    ${subfolderLabel}
                                </a>
                            </td>
                            <td>${playlistData.playlist.length}</td>
                        </tr>
                `;
            });
        }

        htmlContent += `
                    </tbody>
                </table>
            </section>
        `;
    });

    return htmlContent;
}
