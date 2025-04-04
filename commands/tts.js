const { getPrefix } = require('./prefixHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = async (sock, sender, text, msg) => {
    try {
        const prefix = await getPrefix();
        const speechText = text.split(' ').slice(1).join(' ').trim();

        if (!speechText) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}voice <text>\nExample: ${prefix}voice Hello world\`\`\` ☘️Ⓜ️`
            });
        }

        // Show typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        // Free TTS APIs (no auth required)
        const ttsServices = [
            {
                name: "VoiceRSS",
                url: `http://api.voicerss.org/?key=5a7d4b5b3b1d4c4d4d4d4d4d4&hl=en-us&src=${encodeURIComponent(speechText)}&f=16khz_16bit_stereo`
            },
            {
                name: "GoogleTranslateTTS",
                url: `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(speechText)}`
            }
        ];

        let audioBuffer;
        for (const service of ttsServices) {
            try {
                const response = await axios.get(service.url, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                });
                
                if (response.data && response.data.byteLength > 0) {
                    audioBuffer = Buffer.from(response.data);
                    break;
                }
            } catch (err) {
                console.warn(`${service.name} TTS failed:`, err.message);
            }
        }

        if (!audioBuffer) throw new Error("All TTS services failed");

        // Send as voice message
        await sock.sendMessage(sender, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true, // Push-to-talk format for WhatsApp
            caption: `\`\`\`🗣️ "${speechText}"\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('TTS error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Voice generation failed. Try:\n1. Shorter text\n2. Different words\n3. Wait 1 minute``` ☘️Ⓜ️'
        });
    }
};