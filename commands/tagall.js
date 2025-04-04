const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('TagAll command triggered');

        const groupId = msg?.key?.remoteJid;

        // Ensure the command is used in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats!' });
            return;
        }

        // Fetch group metadata
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;

        // Get all participant JIDs
        const allUsers = participants.map(p => p.id);
        console.log('All users:', allUsers);

        // Prepare numbered mentions (vertically)
        const mentions = allUsers.map((user, index) => `[${index + 1}] @${user.split('@')[0]}`).join('\n');

        // Current time
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Unique tag message design with your emoji combo
        const tagMessage = `✨ *ASTRA* ✨ ☘️Ⓜ️\n` +
                           `--------------------------\n` +
                           `🔔 *Attention Everyone!* 🔔\n\n` +
                           `👥 *Members List:*\n${mentions}\n\n` +
                           `⏰ *Time:* ${currentTime}\n` +
                           `👨‍💻 *Creator:* ﾚのズﾉ ﾚのﾚﾑ\n` +
                           `--------------------------\n` +
                           `🔥 Stay active and keep the group alive! 🔥`;

        // Send the tag message
        await sock.sendMessage(groupId, {
            text: tagMessage,
            mentions: allUsers
        });

    } catch (error) {
        console.error('Error tagging users:', error);
        await sock.sendMessage(groupId || sender, { text: '❌ Failed to tag users. Please check permissions and try again.' });
    }
};