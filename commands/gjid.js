const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        await sock.sendMessage(chatJid, { text: `❌ Please reply to a message! Usage: ${prefix}gjid ☘️Ⓜ️` });
        return;
    }

    const quotedJid = msg.message.extendedTextMessage.contextInfo.participant || chatJid;
    await sock.sendMessage(chatJid, { text: `ℹ️ JID: ${quotedJid} ☘️Ⓜ️` });
};