const { getPrefix } = require('./prefixHandler');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    if (!chatJid.endsWith('@g.us')) {
        await sock.sendMessage(chatJid, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatJid);
    const groupAdmins = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id);

    if (!groupAdmins.includes(userJid)) {
        await sock.sendMessage(chatJid, { text: '❌ You need admin privileges to use this command! ☘️Ⓜ️' });
        return;
    }

    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        await sock.sendMessage(chatJid, { text: `❌ Please reply to an image message! Usage: ${prefix}gpp ☘️Ⓜ️` });
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
        console.log('🔍 Downloading image for group profile...');
        const imageBuffer = await downloadMediaMessage(
            quotedMsg,
            'buffer',
            { },
            { logger: require('pino')({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
        );
        console.log(`🔍 Image buffer length: ${imageBuffer.length}`);
        await sock.updateProfilePicture(chatJid, imageBuffer);
        await sock.sendMessage(chatJid, { text: '✅ Group profile picture set successfully! ☘️Ⓜ️' });
    } catch (error) {
        console.error('❌ Error setting group profile picture:', error);
        await sock.sendMessage(chatJid, { text: '❌ Failed to set group profile picture. Image might be too large or bot lacks permission. ☘️Ⓜ️' });
    }
};