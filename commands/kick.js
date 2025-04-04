const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Kick command triggered');

        // Ensure the command is in a group chat
        const groupId = msg?.key?.remoteJid;
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats!' });
            return;
        }

        // Extract mentioned users
        const mentionedUsers = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedUsers.length === 0) {
            await sock.sendMessage(groupId, { text: '❌ Please mention the user(s) you want to kick.' });
            return;
        }

        // Fetch group metadata
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;

        // Get admin list
        const groupAdmins = participants
            .filter(participant => participant.admin)
            .map(admin => admin.id);

        // Check if the sender is an admin
        const senderId = msg.key.participant || msg.key.remoteJid; // For groups, use participant
        if (!groupAdmins.includes(senderId)) {
            await sock.sendMessage(groupId, { text: '❌ You need admin privileges to use this command.' });
            return;
        }

        // Check if the bot is an admin
        const botNumber = sock.user.id.replace(/:\d+/, '') || sock.user.id;
        if (!groupAdmins.includes(botNumber)) {
            await sock.sendMessage(groupId, { text: '❌ I need to be an admin to kick users.' });
            return;
        }

        // Remove mentioned users
        for (const user of mentionedUsers) {
            if (groupAdmins.includes(user)) {
                await sock.sendMessage(groupId, { 
                    text: `❌ I cannot remove admin: @${user.split('@')[0]}`, 
                    mentions: [user] 
                });
                continue;
            }

            try {
                await sock.groupParticipantsUpdate(groupId, [user], 'remove');
                await sock.sendMessage(groupId, { 
                    text: `✅ User @${user.split('@')[0]} has been removed.`, 
                    mentions: [user] 
                });
            } catch (kickError) {
                console.error(`Error kicking specific user ${user}:`, kickError);
                await sock.sendMessage(groupId, { 
                    text: `❌ Failed to kick @${user.split('@')[0]}: ${kickError.message}`, 
                    mentions: [user] 
                });
            }
        }
    } catch (error) {
        console.error('Error kicking user:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to process the kick command. Please try again.' });
    }
};