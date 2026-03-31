const btn = document.getElementById('btnAction');
const status = document.getElementById('status');
const userText = document.getElementById('userText');
const crisText = document.getElementById('crisText');

let socket;
let audioContext;
let processor;
let input;

btn.onclick = async () => {
    if (btn.classList.contains('active')) {
        stopStreaming();
    } else {
        startStreaming();
    }
};

async function startStreaming() {
    status.innerText = "Conectando...";
    
    socket = await getTranscribeSocket(
        (result) => {
            if (!result.IsPartial) {
                const text = result.Alternatives[0].Transcript;
                userText.innerText = text;
                enviarParaBedrock(text);
                stopStreaming();
            }
        },
        () => {
            btn.classList.add('active');
            status.innerText = "Ouvindo... Fale agora!";
            initAudio();
        },
        () => stopStreaming()
    );
}

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        input = audioContext.createMediaStreamSource(stream);
        processor = audioContext.createScriptProcessor(1024, 1, 1);
        input.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(encodePCM(e.inputBuffer.getChannelData(0)));
            }
        };
    });
}

function stopStreaming() {
    btn.classList.remove('active');
    status.innerText = "Aguardando...";
    if (processor) processor.disconnect();
    if (socket) socket.close();
    if (audioContext) audioContext.close();
}

async function enviarParaBedrock(texto) {
    status.innerText = "A Cris está pensando...";
    // Aqui você chama a sua API que fala com o Bedrock Agent
    console.log("Enviando para Bedrock:", texto);
}
