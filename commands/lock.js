const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    const groupId = msg.key.remoteJid;

    // Ensure it's a group chat
    if (!groupId.endsWith('@g.us')) {
        await sock.sendMessage(sender, { text: "❌ This command can only be used in group chats! ☘️Ⓜ️" });
        return;
    }

    try {
        await sock.groupSettingUpdate(groupId, 'announcement');
        await sock.sendMessage(groupId, { text: "🔒 Group has been locked! Only admins can send messages. ☘️Ⓜ️" });
    } catch (error) {
        console.error("❌ Error locking group:", error);
        await sock.sendMessage(sender, { text: "❌ Failed to lock the group. ☘️Ⓜ️" });
    }
};
