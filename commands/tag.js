const { getPrefix } = require('./prefixHandler');

/**
 * Tag all users in a group with a custom message or without a custom message
 * @param {Object} sock - WhatsApp WebSocket client instance
 * @param {String} sender - The ID of the user who sent the command
 * @param {String} text - The message content
 * @param {Object} msg - The full message object
 */
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Tag command triggered');
        
        const prefix = await getPrefix() || '.';
        const groupId = msg?.key?.remoteJid;
        
        // Ensure the command is in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats!' });
            return;
        }
        
        let customMessage = '';
        
        // Check if the command is .tagall or .tag and process accordingly
        if (text.startsWith(prefix + 'tagall')) {
            // If the command is .tagall, we do not require a custom message
            customMessage = '📢 Here are all the group members:';
        } else if (text.startsWith(prefix + 'tag')) {
            // If the command is .tag, slice to get the custom message
            customMessage = text.slice((prefix + 'tag').length).trim();
        }

        // If no message is provided with .tag, we return a message asking for one
        if (customMessage === '' && text.startsWith(prefix + 'tag')) {
            await sock.sendMessage(groupId, { text: '❌ Please provide a custom message after the `.tag` command.' });
            return;
        }
        
        // Fetch group metadata
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;
        
        // Get all participant JIDs
        const allUsers = participants.map(p => p.id);
        console.log('All users:', allUsers);

        // Prepare mentions for tagging
        const mentions = allUsers;

        if (text.startsWith(prefix + 'tagall')) {
            // For `.tagall`, show numbers and include a styled message
            const mentionText = allUsers.map(user => `@${user.split('@')[0]}`).join(', ');

            // Construct the final message
            const tagallMessage = `${customMessage}\n\n${mentionText}`;

            // Send the message with mentions
            await sock.sendMessage(groupId, {
                text: tagallMessage,
                mentions: allUsers,
            });

            console.log(`✅ Tagged ${allUsers.length} users in group ${groupId}`);
        } else if (text.startsWith(prefix + 'tag')) {
            // For `.tag`, only send the custom message without showing numbers
            // Users are still tagged in the background
            await sock.sendMessage(groupId, {
                text: customMessage,
                mentions: allUsers,
            });

            console.log(`✅ Sent custom message and tagged ${allUsers.length} users in group ${groupId}`);
        }
    } catch (error) {
        console.error('Error tagging users:', error);
        await sock.sendMessage(groupId || sender, { text: '❌ Failed to tag users. Please check permissions and try again.' });
    }
};