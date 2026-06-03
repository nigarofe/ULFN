export function openInVsCode(id: number) {
    const filePath = `public/documents/${id}.md`;
    document.body.classList.add('loading');

    fetch(`/__open-in-editor?file=${encodeURIComponent(filePath)}`)
        .catch(err => console.error("Failed to open in editor?", err))
        .finally(() => {
            setTimeout(() => {
                document.body.classList.remove('loading');
            }, 1500);
        });
}