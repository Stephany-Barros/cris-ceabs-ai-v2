const LAMBDA_URL_GEN = "https://x0ht8akouf.execute-api.sa-east-1.amazonaws.com/v2";

async function getTranscribeSocket(onMessageCallback, onOpenCallback, onCloseCallback) {
    try {
        // 1. Chamada para a Lambda. 
        // Usamos POST porque seu teste indicou que a Lambda espera um 'body'
        const response = await fetch(LAMBDA_URL_GEN, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_url" }) 
        });

        // Se a resposta não for 200, paramos aqui para evitar o erro de JSON "undefined"
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // 2. Extração da URL (Lógica para Lambda Proxy Integration)
        let result = data;
        if (data.body && typeof data.body === 'string') {
            result = JSON.parse(data.body);
        }

        const urlGigante = result.websocketUrl;

        if (!urlGigante) {
            throw new Error("URL do WebSocket não encontrada no retorno da API.");
        }

        // 3. Configuração do WebSocket
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
        // Esta linha evita o erro "undefined" mostrando o erro real no console
        console.error("Erro detalhado ao conectar Transcribe:", err.message);
        return null;
    }
}
