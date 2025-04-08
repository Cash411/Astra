const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('🗣️ Starting .tts command');
        const prefix = await getPrefix();
        const commandText = text.trim().startsWith(prefix) ? text.slice(prefix.length).trim() : text.trim();
        const args = commandText.split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (command !== 'tts') return;

        const speechText = args.join(' ').trim();
        if (!speechText) {
            console.log('❌ No text provided');
            await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}tts <text>\nExample: ${prefix}tts Hello world\`\`\` ☘️Ⓜ️`
            });
            return;
        }

        console.log(`🔊 Generating speech for: "${speechText}"`);
        await sock.sendPresenceUpdate('composing', sender);

        const apiKey = process.env.VOICERSS_API_KEY;
        if (!apiKey) {
            throw new Error('VoiceRSS API key not found in .env');
        }

        const url = `http://api.voicerss.org/?key=${apiKey}&hl=en-us&src=${encodeURIComponent(speechText)}&f=16khz_16bit_stereo`;
        console.log('🌐 Requesting TTS from VoiceRSS...');
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        console.log(`📥 Response size: ${response.data.byteLength} bytes`);
        if (response.data.byteLength < 1000) {
            throw new Error('Audio data too small—check API key or text');
        }

        const audioBuffer = Buffer.from(response.data);
        console.log(`📤 Sending audio, size: ${audioBuffer.length} bytes`);
        await sock.sendMessage(sender, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg', // VoiceRSS returns MP3
            ptt: true,
            caption: `\`\`\`🗣️ "${speechText}"\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('TTS error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Voice generation failed. Try:\n1. Shorter text\n2. Different words\n3. Check API key``` ☘️Ⓜ️'
        });
    }
};