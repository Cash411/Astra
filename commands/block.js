const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Block command triggered');

        const chatId = msg?.key?.remoteJid;

        // Ensure the command is used in a private chat
        if (!chatId || chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used in private chats! ☘️Ⓜ️' });
            return;
        }

        // Block the user
        await sock.updateBlockStatus(chatId, "block");
        await sock.sendMessage(chatId, { text: '✅ You have blocked this user. ☘️Ⓜ️' });
    } catch (error) {
        console.error('Error blocking user:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to block the user. Please try again. ☘️Ⓜ️' });
    }
};