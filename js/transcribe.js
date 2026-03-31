const LAMBDA_URL_GEN = "https://x0ht8akouf.execute-api.sa-east-1.amazonaws.com/v2";

async function getTranscribeSocket(onMessageCallback, onOpenCallback, onCloseCallback) {
    try {
        // MUDANÇA CRUCIAL: Usamos GET para evitar o bloqueio de CORS (Preflight)
        const response = await fetch(LAMBDA_URL_GEN, { 
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Se a lambda retornar o objeto direto ou dentro de uma string 'body'
        let result = data;
        if (data.body && typeof data.body === 'string') {
            result = JSON.parse(data.body);
        }

        const urlGigante = result.websocketUrl;

        if (!urlGigante) {
            throw new Error("URL do WebSocket não encontrada no retorno da API.");
        }

        const socket = new WebSocket(urlGigante);
        socket.binaryType = "arraybuffer";

        socket.onopen = (event) => {
            console.log("Conectado ao Transcribe!");
            if (onOpenCallback) onOpenCallback(event);
        };

        socket.onmessage = (message) => {
            try {
                const msg = JSON.parse(message.data);
                if (msg.Transcript && msg.Transcript.Results.length > 0) {
                    onMessageCallback(msg.Transcript.Results[0]);
                }
            } catch (e) {
                console.error("Erro ao ler mensagem do Transcribe:", e);
            }
        };

        socket.onclose = onCloseCallback;
        socket.onerror = (err) => console.error("Erro no WebSocket:", err);

        return socket;

    } catch (err) {
        console.error("Erro detalhado ao conectar Transcribe:", err.message);
        return null;
    }
}
