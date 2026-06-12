import mermaid from 'mermaid'
import morphdom from 'morphdom';

import { openInVsCode } from './utils';
import { initVoiceRecorder } from './voiceRecording';

const params = new URLSearchParams(window.location.search);
const body = document.querySelector('body') as HTMLElement;
const id = params.get('id');
if (!id) { body.innerHTML = `<div class="error">No document ID provided in the URL.</div>`; throw new Error('Document ID is required'); }

mermaid.initialize({ startOnLoad: false, theme: 'default' }); // When changing this line, check if the theme was applied
let eventSource: EventSource | null = null;
await loadDocument(parseInt(id));
initVoiceRecorder();

async function loadDocument(id: number) {
    document.title = `${id} - Document Viewer`;
    const url = `/api/getDocumentViewerBody/?id=${id}`;
    const response = await fetch(url);
    const data = await response.json();
    await applyHtml(data.html);
    updateSSEventSource(id.toString());

    // Update URL with new id while preserving playlist and other params
    const { playlistArray } = getPLaylistInfo();
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('id', id.toString());
    // Keep literal commas in `playlist` while preserving normal encoding for other params.
    newParams.delete('playlist');
    const baseQuery = newParams.toString();
    const playlistParam = `playlist=${playlistArray.map(encodeURIComponent).join(',')}`;
    const newQuery = baseQuery ? `${baseQuery}&${playlistParam}` : playlistParam;
    const newUrl = `${window.location.pathname}?${newQuery}`;

    window.history.pushState(
        { id: id, playlist: playlistArray },
        '',
        newUrl
    );
}

async function applyHtml(html: string) {
    (window as { __pdfReady?: boolean }).__pdfReady = false;
    const virtualContentEl = body.cloneNode(false) as HTMLElement;
    virtualContentEl.innerHTML = html;
    morphdom(body, virtualContentEl);
    convertMermaidCodeBlocks(body);
    await mermaid.run({ querySelector: '.mermaid' });
    if ('fonts' in document) {
        await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }
    (window as { __pdfReady?: boolean }).__pdfReady = true;
}

function convertMermaidCodeBlocks(root: HTMLElement): void {
    const mermaidBlocks = root.querySelectorAll('pre.mermaid > code');

    mermaidBlocks.forEach((codeBlock) => {
        const diagramText = codeBlock.textContent ?? '';
        if (!diagramText.trim()) { return; }

        const mermaidContainer = document.createElement('div');
        mermaidContainer.className = 'mermaid';
        mermaidContainer.textContent = diagramText;

        const pre = codeBlock.closest('pre');
        if (pre) { pre.replaceWith(mermaidContainer); }
        else { codeBlock.replaceWith(mermaidContainer); }
    });
}

function updateSSEventSource(id: string) {
    if (eventSource) { eventSource.close(); }
    eventSource = new EventSource(`/events?id=${id}`);
    eventSource.onmessage = (event) => {
        console.log("Server pushed new HTML content");
        const data = JSON.parse(event.data);
        if (data.html) { applyHtml(data.html); }
    };
    eventSource.onerror = (err) => { console.error("SSE connection failed:", err); };
}




body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const titleContainer = target.closest('.document-title');
    if (titleContainer) {
        const titleBtn = titleContainer.querySelector('.open-at-vscode');
        const titleId = titleBtn?.getAttribute('data-id') || new URLSearchParams(window.location.search).get('id');
        if (titleId) { openInVsCode(parseInt(titleId)); } else {
            console.error('No document ID found for the clicked document title');
        }
        return;
    }

    const mcOption = target.closest('.mc-option') as HTMLElement;
    if (mcOption) {
        const mcOptionClassList = mcOption.classList;
        if (!mcOptionClassList) { return; }
        if (mcOptionClassList.contains('shouldBeSelected')) { mcOptionClassList.add('mc-option--correct'); }
        else { mcOptionClassList.add('mc-option--incorrect'); }
        return;
    }
});

body.addEventListener('input', (e) => {
    const target = e.target as HTMLTextAreaElement | HTMLInputElement;
    if (!target.classList.contains('cloze-input')) { return; }

    const userAnswer = target.value.trim().toLowerCase();
    const rawAnswers = target.getAttribute('data-answers') || "[]";
    let answerList: string[];

    try { answerList = JSON.parse(rawAnswers); } catch { answerList = []; }

    if (answerList.includes(userAnswer)) {
        target.classList.add('cloze-input--correct');
        target.classList.remove('cloze-input--incorrect', 'cloze-input--partial');
    } else if (userAnswer.length > 0 && answerList.some(ans => ans.startsWith(userAnswer))) {
        target.classList.add('cloze-input--partial');
        target.classList.remove('cloze-input--correct', 'cloze-input--incorrect');
    } else {
        target.classList.add('cloze-input--incorrect');
        target.classList.remove('cloze-input--correct', 'cloze-input--partial');
    }
});



const previousExerciseButton = document.getElementById('previousExerciseButton') as HTMLButtonElement;
const nextExerciseButton = document.getElementById('nextExerciseButton') as HTMLButtonElement;

function getPLaylistInfo() {
    const params = new URLSearchParams(window.location.search);
    const currentId = params.get('id');
    const playlist = params.get('playlist');
    // Get current index in the playlist
    // if (!playlist) throw new Error('Playlist parameter is missing in the URL');
    if (!playlist) { return { playlistArray: [String(currentId)], currentIndex: 0 }; }
    const playlistArray = playlist.split(',').map(id => id.trim());
    const currentIndex = playlistArray.indexOf(currentId || '');

    return { playlistArray, currentIndex };
}

function goToPreviousExercise() {
    const { playlistArray, currentIndex } = getPLaylistInfo();
    if (currentIndex == 0) { return; }
    const previousId = playlistArray[currentIndex - 1];
    loadDocument(parseInt(previousId));
}

function goToNextExercise() {
    const { playlistArray, currentIndex } = getPLaylistInfo();
    if (currentIndex == playlistArray.length - 1) { return; }
    const nextId = playlistArray[currentIndex + 1];
    loadDocument(parseInt(nextId));
}

previousExerciseButton.addEventListener('click', () => {
    goToPreviousExercise();
});

nextExerciseButton.addEventListener('click', () => {
    goToNextExercise();
});

window.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    const isEditable = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );

    if (isEditable) { return; }
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousExercise();
        return;
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextExercise();
    }
});
