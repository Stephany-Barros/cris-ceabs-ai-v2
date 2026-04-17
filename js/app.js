// Configurações Globais
const API_URL_CHAT = "https://x0ht8akouf.execute-api.sa-east-1.amazonaws.com/v2/chat";
const btn = document.getElementById('btnAction');
const status = document.getElementById('status');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');

let socket;
let audioContext;
let processor;
let input;

// --- LÓGICA DE INTERFACE (BALÕES) ---

function adicionarMensagem(texto, remetente) {
    const div = document.createElement('div');
    div.classList.add('message', remetente);
    div.innerText = texto;
    chatWindow.appendChild(div);
    
    // Scroll automático para a última mensagem
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- INTEGRAÇÃO COM A CRIS (BEDROCK) ---

async function enviarParaBedrock(texto) {
    status.innerText = "A Cris está pensando...";
    
    try {
        const response = await fetch(API_URL_CHAT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: texto })
        });

        const data = await response.json();

        if (data.success) {
            adicionarMensagem(data.response, 'cris');
            status.innerText = "Aguardando...";
        } else {
            adicionarMensagem("Erro: " + (data.error || "Sem resposta"), 'cris');
        }
    } catch (error) {
        console.error("Erro na API:", error);
        adicionarMensagem("Ops! Tive um problema de conexão com a AWS.", 'cris');
        status.innerText = "Erro de conexão.";
    }
}

// --- LÓGICA DE VOZ (MICROFONE) ---

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
                adicionarMensagem(text, 'user'); // Adiciona o que você falou como balão
                enviarParaBedrock(text);         // Envia o texto da voz para a Cris
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

// --- LÓGICA DE TEXTO (DIGITAÇÃO) ---

async function enviarMensagemTexto() {
    const texto = chatInput.value.trim();
    if (!texto) return;

    chatInput.value = "";
    adicionarMensagem(texto, 'user'); // Adiciona o que você digitou como balão
    enviarParaBedrock(texto);         // Envia o texto digitado para a Cris
}

btnSendChat.onclick = enviarMensagemTexto;

chatInput.onkeypress = (e) => {
    if (e.key === 'Enter') enviarMensagemTexto();
};
