const { getPrefix } = require('./prefixHandler');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        await sock.sendMessage(chatJid, { text: `❌ Please reply to an image message! Usage: ${prefix}fpp ☘️Ⓜ️` });
        return;
    }

    const quotedMsg = {
        key: msg.message.extendedTextMessage.contextInfo.stanzaId
            ? {
                  remoteJid: chatJid,
                  id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                  participant: msg.message.extendedTextMessage.contextInfo.participant || userJid
              }
            : msg.key,
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage
    };

    if (!quotedMsg.message?.imageMessage) {
        await sock.sendMessage(chatJid, { text: '❌ Replied message must be an image! ☘️Ⓜ️' });
        return;
    }

    try {
        console.log('🔍 Downloading image for profile...');
        const imageBuffer = await downloadMediaMessage(
            quotedMsg,
            'buffer',
            { },
            { logger: require('pino')({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
        );
        console.log(`🔍 Image buffer length: ${imageBuffer.length}`);
        await sock.updateProfilePicture(userJid, imageBuffer);
        await sock.sendMessage(chatJid, { text: '✅ Profile picture set successfully! ☘️Ⓜ️' });
    } catch (error) {
        console.error('❌ Error setting profile picture:', error);
        await sock.sendMessage(chatJid, { text: '❌ Failed to set profile picture. Image might be too large or bot lacks permission. ☘️Ⓜ️' });
    }
};