const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Promote command triggered');

        const groupId = msg?.key?.remoteJid;

        // Ensure the command is used in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        // Extract mentioned users
        const mentionedUsers = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedUsers.length === 0) {
            await sock.sendMessage(groupId, { text: '❌ Please mention the user(s) you want to promote. ☘️Ⓜ️' });
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
            await sock.sendMessage(groupId, { text: '❌ You need admin privileges to use this command. ☘️Ⓜ️' });
            return;
        }

        // Check if the bot is an admin
        const botNumber = sock.user.id.replace(/:\d+/, '') || sock.user.id;
        if (!groupAdmins.includes(botNumber)) {
            await sock.sendMessage(groupId, { text: '❌ I need to be an admin to promote users. ☘️Ⓜ️' });
            return;
        }

        // Promote mentioned users
        for (const user of mentionedUsers) {
            if (groupAdmins.includes(user)) {
                await sock.sendMessage(groupId, { 
                    text: `❌ User @${user.split('@')[0]} is already an admin. ☘️Ⓜ️`, 
                    mentions: [user] 
                });
                continue;
            }

            try {
                await sock.groupParticipantsUpdate(groupId, [user], 'promote');
                await sock.sendMessage(groupId, { 
                    text: `✅ User @${user.split('@')[0]} has been promoted to admin. ☘️Ⓜ️`, 
                    mentions: [user] 
                });
            } catch (error) {
                console.error(`Error promoting user ${user}:`, error);
                await sock.sendMessage(groupId, { 
                    text: `❌ Failed to promote @${user.split('@')[0]}: ${error.message} ☘️Ⓜ️`, 
                    mentions: [user] 
                });
            }
        }
    } catch (error) {
        console.error('Error promoting users:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to process the promote command. Please try again. ☘️Ⓜ️' });
    }
};