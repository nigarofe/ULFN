import * as lamejs from '@breezystack/lamejs';

type RecorderContext = {
    btnStartPause: HTMLButtonElement;
    btnStopSave: HTMLButtonElement;
    timerDisplay: HTMLSpanElement | null;
    audioPlayback: HTMLAudioElement | null;
    mediaRecorder: MediaRecorder | null;
    audioChunks: Blob[];
    startTime: number;
    elapsedTime: number;
    timerInterval: number | undefined;
};

export function initVoiceRecorder() {
    const voiceRecorderDiv = document.getElementById('voice-recorder');
    if (!voiceRecorderDiv) { console.error("Voice recorder div not found in the DOM."); return; }

    const btnStartPause = document.getElementById('btnStartPause') as HTMLButtonElement;
    const btnStopSave = document.getElementById('btnStopSave') as HTMLButtonElement;
    if (!btnStartPause || !btnStopSave) { console.error("Voice recorder buttons not found in the DOM."); return; }

    const timerDisplay = voiceRecorderDiv.querySelector('span');
    const audioPlayback = document.getElementById('audioPlayback') as HTMLAudioElement | null;

    const context: RecorderContext = {
        btnStartPause,
        btnStopSave,
        timerDisplay,
        audioPlayback,
        mediaRecorder: null,
        audioChunks: [],
        startTime: 0,
        elapsedTime: 0,
        timerInterval: undefined
    };

    btnStartPause.addEventListener('click', onStartPauseClick.bind(null, context));
    btnStopSave.addEventListener('click', onStopSaveClick.bind(null, context));
}

function onStartPauseClick(context: RecorderContext) {
    console.log("Start/Pause button clicked");
    if (!context.mediaRecorder || context.mediaRecorder.state === 'inactive') {
        void startRecording(context);
    } else {
        togglePause(context);
    }
}

function onStopSaveClick(context: RecorderContext) {
    if (context.mediaRecorder) {
        stopRecording(context);
    }
}

async function startRecording(context: RecorderContext) {
    if (!window.isSecureContext) {
        alert("Audio recording requires HTTPS (or localhost).");
        return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
        alert("Your browser does not support audio recording.");
        return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err: DOMException) => {
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
            alert("Microphone permission was denied. Please allow microphone access and try again.");
        } else {
            alert("Could not access microphone.");
        }
        console.error("Error accessing microphone:", err);
        return null;
    });

    if (!stream) { return; }

    const activeRecorder = new MediaRecorder(stream);
    context.mediaRecorder = activeRecorder;
    context.audioChunks = [];

    // Clear previous playback source when starting new recording
    if (context.audioPlayback) { context.audioPlayback.src = ""; }

    activeRecorder.addEventListener("dataavailable", onDataAvailable.bind(null, context));
    activeRecorder.addEventListener("stop", onRecorderStop.bind(null, context));
    activeRecorder.start();

    // Timer logic
    context.elapsedTime = 0;
    context.startTime = Date.now();
    context.timerInterval = window.setInterval(updateTimer.bind(null, context), 100);

    // UI updates
    context.btnStartPause.textContent = "Pause";
    context.btnStopSave.disabled = false;
}

function onDataAvailable(context: RecorderContext, event: BlobEvent) {
    context.audioChunks.push(event.data);
}

async function onRecorderStop(context: RecorderContext) {
    // Update UI to indicate processing
    const originalText = context.btnStopSave.textContent;
    context.btnStopSave.textContent = "Processing...";
    context.btnStopSave.disabled = true;

    // 1. Create WebM blob (intermediate step)
    const webmBlob = new Blob(context.audioChunks, { type: 'audio/webm' });

    // Hook up WebM immediately so the user can hit play instantly.
    if (context.audioPlayback) {
        const webmUrl = URL.createObjectURL(webmBlob);
        context.audioPlayback.src = webmUrl;
    }

    // 2. Convert to MP3
    try {
        const mp3Blob = await convertWebMToMP3(webmBlob);
        if (context.audioPlayback) {
            const mp3Url = URL.createObjectURL(mp3Blob);
            context.audioPlayback.src = mp3Url;
        }

        // Optional: this line triggers the file to auto-download
        // triggerDownload(mp3Blob);
    } catch (error) {
        console.error("Conversion failed", error);
        alert("Failed to convert audio.");
    } finally {
        // Reset UI
        context.btnStopSave.textContent = originalText || "Stop & Save";
        // Note: button stays disabled because recording stopped
    }
}

function togglePause(context: RecorderContext) {
    if (!context.mediaRecorder) return;

    if (context.mediaRecorder.state === "recording") {
        context.mediaRecorder.pause();
        clearInterval(context.timerInterval);
        context.elapsedTime += Date.now() - context.startTime;

        context.btnStartPause.textContent = "Resume";
    } else if (context.mediaRecorder.state === "paused") {
        context.mediaRecorder.resume();
        context.startTime = Date.now();
        context.timerInterval = window.setInterval(updateTimer.bind(null, context), 100);

        context.btnStartPause.textContent = "Pause";
    }
}

function stopRecording(context: RecorderContext) {
    if (!context.mediaRecorder) return;

    context.mediaRecorder.stop();
    context.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    clearInterval(context.timerInterval);

    // Reset UI
    context.btnStartPause.textContent = "Start Recording";
    context.btnStopSave.disabled = true;
    // Timer display is left as is until next recording starts
}

function updateTimer(context: RecorderContext) {
    const timeNow = Date.now();
    const timePassed = context.elapsedTime + (timeNow - context.startTime);
    const seconds = Math.floor((timePassed / 1000) % 60);
    const minutes = Math.floor((timePassed / 1000 / 60) % 60);

    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (context.timerDisplay) {
        context.timerDisplay.textContent = formattedTime;
    }
}

async function convertWebMToMP3(webmBlob: Blob): Promise<Blob> {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Initialize LameJS Encoder (Mono, Source Sample Rate, 128kbps)
    // Note: LameJS expects integer samples, WebAudio gives floats
    const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
    const samples = audioBuffer.getChannelData(0); // Left channel
    const sampleBlockSize = 1152;
    const mp3Data: Uint8Array[] = [];

    const sampleChunk = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        sampleChunk[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    for (let i = 0; i < sampleChunk.length; i += sampleBlockSize) {
        const sampleBlock = sampleChunk.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleBlock);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) { mp3Data.push(mp3buf); }

    return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
}
