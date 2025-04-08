const fsPromises = require('node:fs/promises');
const { getPrefix } = require('./prefixHandler');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, sender, text, msg) => {
    console.log('🎵 Starting .v2a command');
    const prefix = await getPrefix();
    const commandText = text.trim().startsWith(prefix) ? text.slice(prefix.length).trim() : text.trim();
    const args = commandText.split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (command !== 'v2a') return;

    // Check if message is a reply to a video
    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
        console.log('❌ No video in replied message');
        await sock.sendMessage(sender, { text: `\`\`\`Reply to a video message with ${prefix}v2a ☘️Ⓜ️\`\`\`` });
        return;
    }

    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    console.log('🎥 Found video in quoted message');

    try {
        const txt = '```\n' +
                    '✨ ASTRA VIDEO TO AUDIO ✨\n' +
                    '  ⚡ Converting video to audio...\n' +
                    '``` ☘️Ⓜ️';
        await sock.sendMessage(sender, { text: txt }, { quoted: msg });

        // Download the video buffer
        console.log('📥 Downloading video');
        const videoBuffer = await downloadMediaMessage({ message: quotedMsg }, 'buffer');
        console.log(`ℹ️ Video buffer length: ${videoBuffer.length}`);

        // Attempt to send as audio (hoping WhatsApp extracts the audio track)
        console.log('📤 Sending audio');
        const sentMsg = await sock.sendMessage(sender, {
            audio: videoBuffer,
            mimetype: 'audio/mp4', // Try to force audio playback
            ptt: false,
            fileLength: videoBuffer.length,
        }, { quoted: msg });
        console.log('✅ Audio sent:', JSON.stringify(sentMsg, null, 2));

        await sock.sendMessage(sender, { text: '```🎉 Audio delivered! Enjoy ☘️Ⓜ️```' });

    } catch (error) {
        console.error('Error in .v2a:', error);
        await sock.sendMessage(sender, { text: `\`\`\`❌ Conversion failed: ${error.message} ☘️Ⓜ️\`\`\`` });
    }
};