const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Leave command triggered');

        const groupId = msg?.key?.remoteJid;

        // Ensure the command is used in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        // Leave the group
        await sock.groupLeave(groupId);
        await sock.sendMessage(sender, { text: '✅Goodbye! ☘️Ⓜ️' });
    } catch (error) {
        console.error('Error leaving group:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to leave the group. Please try again. ☘️Ⓜ️' });
    }
};