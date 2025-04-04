const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('GInfo command triggered');

        const groupId = msg?.key?.remoteJid;

        // Ensure the command is used in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        // Fetch group metadata
        const groupMetadata = await sock.groupMetadata(groupId);

        const groupName = groupMetadata.subject || 'No Name';
        const groupDescription = groupMetadata.desc || 'No Description';
        const groupMembers = groupMetadata.participants.length;

        // Construct the message
        const ginfoMessage = `ℹ️ *Group Info:* ☘️Ⓜ️\n\n` +
                             `*Name:* ${groupName}\n` +
                             `*Description:* ${groupDescription}\n` +
                             `*Members:* ${groupMembers}`;

        // Send the group info
        await sock.sendMessage(groupId, { text: ginfoMessage });
    } catch (error) {
        console.error('Error fetching group info:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to fetch group info. Please try again. ☘️Ⓜ️' });
    }
};