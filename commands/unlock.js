const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    const groupId = msg.key.remoteJid;

    // Ensure it's a group chat
    if (!groupId.endsWith('@g.us')) {
        await sock.sendMessage(sender, { text: "❌ This command can only be used in group chats! ☘️Ⓜ️" });
        return;
    }

    try {
        await sock.groupSettingUpdate(groupId, 'not_announcement');
        await sock.sendMessage(groupId, { text: "🔓 Group has been unlocked! Everyone can send messages now. ☘️Ⓜ️" });
    } catch (error) {
        console.error("❌ Error unlocking group:", error);
        await sock.sendMessage(sender, { text: "❌ Failed to unlock the group. ☘️Ⓜ️" });
    }
};
