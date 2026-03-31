const LAMBDA_URL_GEN = "https://x0ht8akouf.execute-api.sa-east-1.amazonaws.com/";

async function getTranscribeSocket(onMessageCallback, onOpenCallback, onCloseCallback) {
    try {
        // 1. Chamada para a Lambda enviando um body inicial para evitar erro no Python
        const response = await fetch(LAMBDA_URL_GEN, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: "generate_presigned_url" }) 
        });

        if (!response.ok) {
            throw new Error(`Erro na API Gateway: ${response.status}`);
        }

        const data = await response.json();
        
        // 2. Lógica de extração da URL Gigante (Tratando Proxy Integration)
        let result = data;
        
        // Se a Lambda retornar o JSON dentro de uma string 'body' (comum no AWS Proxy)
        if (data.body && typeof data.body === 'string') {
            result = JSON.parse(data.body);
        }

        const urlGigante = result.websocketUrl;

        if (!urlGigante) {
            console.error("Resposta recebida da AWS:", data);
            throw new Error("Não foi possível encontrar a websocketUrl no retorno.");
        }

        // 3. Inicialização do WebSocket com a URL assinada
        const socket = new WebSocket(urlGigante);
        socket.binaryType = "arraybuffer";

        socket.onopen = (event) => {
            console.log("Conectado ao Amazon Transcribe com sucesso!");
            if (onOpenCallback) onOpenCallback(event);
        };

        socket.onmessage = (message) => {
            try {
                const messageData = JSON.parse(message.data);
                
                // Verifica se há transcrição no retorno do stream
                if (messageData.Transcript && messageData.Transcript.Results.length > 0) {
                    onMessageCallback(messageData.Transcript.Results[0]);
                }
            } catch (e) {
                console.error("Erro ao processar mensagem do Transcribe:", e);
            }
        };

        socket.onclose = (event) => {
            console.log("Conexão com Transcribe encerrada.");
            if (onCloseCallback) onCloseCallback(event);
        };

        socket.onerror = (err) => {
            console.error("Erro crítico no WebSocket do Transcribe:", err);
        };

        return socket;

    } catch (err) {
        console.error("Erro ao conectar Transcribe:", err);
        return null;
    }
}
