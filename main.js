// main.js - Screen Recorder Logic for Bear Recorder

const startBtn = document.getElementById('recording-btn');
const stopBtn = document.getElementById('stop-btn');
const statusMsg = document.getElementById('status-msg');
const downloadBtn = document.getElementById('download-btn');
const videoElement = document.getElementById('recordedVideo');

let mediaRecorder;
let recordedChunks = [];
let stream = null;

function setUIState(state) {
    switch (state) {
        case 'idle':
            startBtn.style.display = '';
            stopBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
            statusMsg.style.display = 'none';
            videoElement.style.display = 'none';
            videoElement.src = '';
            break;
        case 'recording':
            startBtn.style.display = 'none';
            stopBtn.style.display = '';
            downloadBtn.style.display = 'none';
            statusMsg.style.display = '';
            statusMsg.textContent = '🔴 Recording... Click "stop recording" to finish.';
            videoElement.style.display = 'none';
            break;
        case 'preview':
            startBtn.style.display = '';
            stopBtn.style.display = 'none';
            downloadBtn.style.display = '';
            statusMsg.style.display = '';
            statusMsg.textContent = '✅ Recording finished. Preview below or download.';
            break;
    }
}

// Choose the best supported MIME type for WebM/MP4
function getSupportedMimeType() {
    const types = [
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8',
        'video/webm',                // default codec (usually VP8)
        'video/mp4'                  // fallback (less common for screen capture)
    ];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return ''; // No supported type – will be handled with error
}

async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' },
            audio: true
        });

        recordedChunks = [];

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            throw new Error('No supported video MIME type found for MediaRecorder.');
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            videoElement.src = url;
            videoElement.style.display = '';
            setUIState('preview');
            downloadBtn.blobData = blob;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };

        stream.getVideoTracks()[0].onended = () => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        };

        mediaRecorder.start();
        setUIState('recording');
    } catch (err) {
        console.error('Error starting screen capture:', err);
        setUIState('idle');
        alert('Could not start recording. Please grant screen sharing permission and try again.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

function downloadRecording() {
    if (!downloadBtn.blobData) return;
    const blob = downloadBtn.blobData;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `bear-recording-${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadRecording);

setUIState('idle');