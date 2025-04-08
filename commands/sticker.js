const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const { getPrefix } = require('./prefixHandler');

async function imgToSticker(sock, sender, text, msg) {
    try {
        // Check FFmpeg availability
        const hasFfmpeg = await new Promise(resolve => {
            ffmpeg.getAvailableFormats(err => resolve(!err));
        }).catch(() => false);

        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage || (!quotedMessage.imageMessage && !quotedMessage.videoMessage)) {
            await sock.sendMessage(sender, { text: '```❌ Please reply to an image or video with .sticker``` ☘️Ⓜ️' });
            return;
        }

        const isVideo = !!quotedMessage.videoMessage;
        const mediaMessage = isVideo ? quotedMessage.videoMessage : quotedMessage.imageMessage;

        // Block video if FFmpeg is missing
        if (isVideo && !hasFfmpeg) {
            await sock.sendMessage(sender, { text: '```❌ Can’t convert video to sticker—feature coming soon! Try an image instead.``` ☘️Ⓜ️' });
            return;
        }

        const media = await downloadMediaMessage(
            {
                key: msg.message.extendedTextMessage.contextInfo.stanzaId ? {
                    remoteJid: sender,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                } : msg.key,
                message: quotedMessage
            },
            'buffer',
            { sock }
        );
        const mimeType = mediaMessage.mimetype;
        const fileExt = mimeType.split('/')[1];

        const tempFilePath = path.join(__dirname, 'temp', `${Date.now()}.${fileExt}`);
        await fs.writeFile(tempFilePath, media);

        const sticker = new Sticker(tempFilePath, {
            pack: ' ',
            author: 'Astra☘️Ⓜ️',
            type: StickerTypes.FULL,
            quality: isVideo ? 50 : 70,
            ...(isVideo && { fps: 15, loop: true })
        });

        const stickerBuffer = await sticker.toBuffer();
        await sock.sendMessage(sender, { sticker: stickerBuffer }, { quoted: msg });

        await fs.unlink(tempFilePath);

    } catch (error) {
        console.error('Error creating sticker:', error);
        await sock.sendMessage(sender, { text: '```❌ Failed to create sticker. Try again later.``` ☘️Ⓜ️' });
    }
}

module.exports = imgToSticker;