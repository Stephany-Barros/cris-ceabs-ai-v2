const LAMBDA_URL_GEN = "https://x0ht8akouf.execute-api.sa-east-1.amazonaws.com";

async function getTranscribeSocket(onMessageCallback, onOpenCallback, onCloseCallback) {
    try {
        const response = await fetch(LAMBDA_URL_GEN, { method: 'POST' });
        const data = await response.json();
        const body = JSON.parse(data.body);

        if (!body.success) throw new Error("Erro ao gerar URL");

        const socket = new WebSocket(body.websocketUrl);
        socket.binaryType = "arraybuffer";

        socket.onopen = onOpenCallback;
        socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.Transcript && data.Transcript.Results.length > 0) {
                onMessageCallback(data.Transcript.Results[0]);
            }
        };
        socket.onclose = onCloseCallback;
        socket.onerror = (err) => console.error("Erro WebSocket:", err);

        return socket;
    } catch (err) {
        console.error("Erro ao conectar Transcribe:", err);
        return null;
    }
}
