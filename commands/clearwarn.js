const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

// Path to the warnings JSON file
const WARNINGS_FILE = path.join(__dirname, 'warnings.json');

// Load existing warnings from the file or initialize an empty object
let warnedUsers = {};
if (fs.existsSync(WARNINGS_FILE)) {
    try {
        const fileContent = fs.readFileSync(WARNINGS_FILE, 'utf8');
        warnedUsers = fileContent.trim() ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error('Error parsing warnings.json:', error);
        warnedUsers = {}; // Initialize as an empty object if parsing fails
    }
} else {
    // Create the file if it doesn't exist
    fs.writeFileSync(WARNINGS_FILE, '{}', 'utf8');
}

// Save warnings to the file
const saveWarnings = () => {
    try {
        fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnedUsers, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving warnings.json:', error);
    }
};

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('ClearWarns command triggered');

        const groupId = msg?.key?.remoteJid;

        // Ensure the command is used in a group chat
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        // Extract the target user ID
        let targetUser = null;

        // Check if the message is a reply
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            // Get the sender of the replied message
            targetUser = msg.message.extendedTextMessage.contextInfo.participant;
        } else {
            // Fallback to mentioned users
            const mentionedUsers = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentionedUsers.length === 0) {
                await sock.sendMessage(groupId, { text: '❌ Please mention or reply to the user whose warnings you want to clear. ☘️Ⓜ️' });
                return;
            }
            targetUser = mentionedUsers[0]; // Use the first mentioned user
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

        // Clear warnings for the target user
        if (warnedUsers[groupId] && warnedUsers[groupId][targetUser]) {
            delete warnedUsers[groupId][targetUser];

            // Custom clearwarns message design
            const clearWarnMessage = `✅ *WARNINGS CLEARED* ✅\n\n` +
                                     `👤 *User:* @${targetUser.split('@')[0]}\n` +
                                     `♻️ *Status:* All warnings have been cleared. ☘️Ⓜ️`;

            await sock.sendMessage(groupId, { 
                text: clearWarnMessage, 
                mentions: [targetUser] 
            });
        } else {
            await sock.sendMessage(groupId, { 
                text: `❌ *NO WARNINGS FOUND* ❌\n\n` +
                      `👤 *User:* @${targetUser.split('@')[0]}\n` +
                      `🔍 *Status:* No warnings found for this user. ☘️Ⓜ️`, 
                mentions: [targetUser] 
            });
        }

        // Save warnings to the file
        saveWarnings();
    } catch (error) {
        console.error('Error clearing warnings:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to process the clearwarns command. Please try again. ☘️Ⓜ️' });
    }
};