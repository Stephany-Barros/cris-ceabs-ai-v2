// Função para converter o áudio do navegador para PCM 16-bit (requisito AWS)
function encodePCM(samples) {
    let buffer = new ArrayBuffer(samples.length * 2);
    let view = new DataView(buffer);
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
}
