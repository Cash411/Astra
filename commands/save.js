const { messageSaver } = require('../server');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, sender, text, msg) => {
    try {
        if (!messageSaver.sock) {
            messageSaver.initialize(sock);
            console.log('🔧 Save command initialized sock');
        }

        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            return sock.sendMessage(sender, {
                text: '```❌ Please reply to a message with .save``` ☘️Ⓜ️'
            });
        }

        const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        const quotedKey = msg.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedSender = msg.message.extendedTextMessage.contextInfo.participant || msg.key.remoteJid;

        let quotedContactName = quotedSender.split('@')[0];
        try {
            const contactInfo = await messageSaver.fetchContact(quotedSender);
            quotedContactName = contactInfo?.name || contactInfo?.notify || quotedSender.split('@')[0];
        } catch (e) {
            console.error(`⚠️ Failed to fetch quoted contact name: ${e.message}`);
        }

        let savedContent = { type: null, content: null, caption: '' };

        if (quotedMessage.conversation) {
            savedContent = { type: 'text', content: quotedMessage.conversation, caption: '' };
        } else if (quotedMessage.imageMessage) {
            const stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
            const buffer = await messageSaver.streamToBuffer(stream);
            savedContent = { type: 'image', content: buffer, caption: quotedMessage.imageMessage.caption || '' };
        } else if (quotedMessage.videoMessage) {
            const stream = await downloadContentFromMessage(quotedMessage.videoMessage, 'video');
            const buffer = await messageSaver.streamToBuffer(stream);
            savedContent = { type: 'video', content: buffer, caption: quotedMessage.videoMessage.caption || '' };
        } else if (quotedMessage.audioMessage) {
            const stream = await downloadContentFromMessage(quotedMessage.audioMessage, 'audio');
            const buffer = await messageSaver.streamToBuffer(stream);
            savedContent = { type: 'audio', content: buffer, caption: '' };
        } else if (quotedMessage.stickerMessage) {
            const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
            const buffer = await messageSaver.streamToBuffer(stream);
            savedContent = { type: 'sticker', content: buffer, caption: '' };
        }

        if (!savedContent.type) {
            await sock.sendMessage(sender, { text: '```❌ Unsupported message type``` ☘️Ⓜ️' });
            return;
        }

        messageSaver.state.savedMessages[quotedKey] = {
            key: { remoteJid: quotedSender, id: quotedKey, fromMe: false },
            contact: quotedContactName,
            ...savedContent
        };
        messageSaver._saveState();
        console.log(`💾 Saved message ${quotedKey} from ${quotedSender}`);

        const success = await messageSaver.saveMessage(quotedKey);
        await sock.sendMessage(sender, { text: success ? '☘️Ⓜ️' : '❌☘️Ⓜ️' });

    } catch (error) {
        console.error('Save command error:', error.message);
        await sock.sendMessage(sender, { text: '❌☘️Ⓜ️' });
    }
};