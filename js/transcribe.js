const LAMBDA_URL_GEN = "https://x0ht8akouf.execute-api.sa-east-1.amazonaws.com/";

async function getTranscribeSocket(onMessageCallback, onOpenCallback, onCloseCallback) {
    try {
        // 1. Alteramos para GET (ou garantimos que a rota aceite POST)
        // Se no navegador o link direto funciona, use GET aqui também.
        const response = await fetch(LAMBDA_URL_GEN, { method: 'GET' }); 
        
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        // 2. A CORREÇÃO CRITICAL:
        // O seu teste de sucesso mostrou que a Lambda já retorna o JSON estruturado.
        // Não use JSON.parse(data.body) se o data já contiver os campos.
        const data = await response.json();

        // Verificamos se o websocketUrl está na raiz do retorno ou dentro de body
        const websocketUrl = data.websocketUrl || (data.body ? JSON.parse(data.body).websocketUrl : null);

        if (!websocketUrl) {
            console.error("Resposta da API:", data);
            throw new Error("URL do WebSocket não encontrada na resposta");
        }

        const socket = new WebSocket(websocketUrl);
        // ... restante do seu código (onopen, onmessage, etc)
