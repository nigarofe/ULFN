import morphdom from 'morphdom';

import { openInVsCode } from './utils';
import { initCharts } from './initCharts';

const body = document.querySelector('body') as HTMLElement;
document.title = "Document Selector";
const params = new URLSearchParams(window.location.search);

const inputs = [
    { param: 'discipline', defaultValue: 'All', selectId: 'discipline-select', },
    { param: 'classification', defaultValue: 'All', selectId: 'classification-select' },
    { param: 'orderBy', defaultValue: 'PMG-X', selectId: 'order-by-select' },
    { param: 'order', defaultValue: 'Descending', selectId: 'order-select' }
];

inputs.forEach(input => {
    if (!params.get(input.param)) { params.set(input.param, input.defaultValue); }
});
window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

await update(); // Don't move this above the params initialization

async function update() {
    const params = new URLSearchParams(window.location.search);
    const url = `/api/getDocumentSelectorBody?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    const virtualContentEl = body.cloneNode(false) as HTMLElement;
    virtualContentEl.innerHTML = data.html;
    morphdom(body, virtualContentEl);
    initCharts();
}

document.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    const input = inputs.find(i => i.selectId === target.id);
    if (input) {
        params.set(input.param, target.value);
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        update();
    }
});


document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const cardElement = target.closest('.document-card-number') || target.closest('.document-card-metadata') || target.closest('.document-srm');
    if (cardElement) {
        const id = cardElement.getAttribute('data-id');
        // if (id) window.open(`/documentViewer?id=${id}`, '_blank'); // Open in new tab
        if (id) window.location.href = `/documentViewer?id=${id}`; // Open in same tab
        return;
    }

    const vscodeBtn = target.closest('.open-at-vscode');
    if (vscodeBtn) {
        const id = vscodeBtn.getAttribute('data-id');
        if (id) openInVsCode(parseInt(id));
        return;
    }
});
