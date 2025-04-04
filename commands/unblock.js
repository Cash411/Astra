const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Unblock command triggered');

        const chatId = msg?.key?.remoteJid;

        // Ensure the command is used in a private chat
        if (!chatId || chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used in private chats! ☘️Ⓜ️' });
            return;
        }

        // Unblock the user
        await sock.updateBlockStatus(chatId, "unblock");
        await sock.sendMessage(chatId, { text: '✅ You have unblocked this user. ☘️Ⓜ️' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to unblock the user. Please try again. ☘️Ⓜ️' });
    }
};