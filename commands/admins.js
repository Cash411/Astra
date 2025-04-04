const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('ListAdmins command triggered');

        const groupId = msg?.key?.remoteJid;

        // Ensure the command is used in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        // Fetch group metadata
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;

        // Get admin list
        const groupAdmins = participants
            .filter(participant => participant.admin)
            .map(admin => `@${admin.id.split('@')[0]}`);

        if (groupAdmins.length === 0) {
            await sock.sendMessage(groupId, { text: '❌ No admins found in this group. ☘️Ⓜ️' });
            return;
        }

        // Send the list of admins
        await sock.sendMessage(groupId, {
            text: `👑 *Group Admins:* ${groupAdmins.join(', ')} ☘️Ⓜ️`,
            mentions: participants.filter(p => p.admin).map(p => p.id),
        });
    } catch (error) {
        console.error('Error listing admins:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to list admins. Please try again. ☘️Ⓜ️' });
    }
};