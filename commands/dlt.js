const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    // Check if the message is a reply
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg || !msg.message?.extendedTextMessage?.contextInfo?.stanzaId) {
        await sock.sendMessage(chatJid, { 
            text: `\`\`\`❌ Please reply to a message with ${prefix}dlt to delete it! ☘️Ⓜ️\`\`\`` 
        });
        return;
    }

    // Extract the key of the quoted message
    const deleteKey = {
        remoteJid: chatJid,
        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
        participant: msg.message.extendedTextMessage.contextInfo.participant || userJid
    };

    // Delete the quoted message
    try {
        await sock.sendMessage(chatJid, { delete: deleteKey });
        await sock.sendMessage(chatJid, { 
            text: '```✅ Message deleted! ☘️Ⓜ️```' 
        });
    } catch (error) {
        await sock.sendMessage(chatJid, { 
            text: '```❌ Failed to delete message. ☘️Ⓜ️```' 
        });
        throw error; // Let server.js log the error
    }
};