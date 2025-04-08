const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

// Path to the warnings JSON file
const WARNINGS_FILE = path.join(__dirname, '../database/warnings.json');

// Load existing warnings
let warnedUsers = {};
if (fs.existsSync(WARNINGS_FILE)) {
    try {
        const fileContent = fs.readFileSync(WARNINGS_FILE, 'utf8');
        warnedUsers = fileContent.trim() ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error('Error parsing warnings.json:', error);
        warnedUsers = {};
    }
} else {
    fs.writeFileSync(WARNINGS_FILE, '{}', 'utf8');
}

const saveWarnings = () => {
    try {
        fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnedUsers, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving warnings.json:', error);
    }
};

module.exports = async (sock, chatJid, text, msg) => {
    try {
        console.log('Warn command triggered');

        const groupId = msg?.key?.remoteJid;
        const userJid = groupId.endsWith('@g.us') ? msg.key.participant : msg.key.remoteJid;

        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(chatJid, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        let targetUser = userJid; // Default to sender for antispam
        if (text) { // Manual warn via command
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetUser = msg.message.extendedTextMessage.contextInfo.participant;
            } else {
                const mentionedUsers = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentionedUsers.length === 0) {
                    await sock.sendMessage(groupId, { text: '❌ Please mention or reply to the user you want to warn. ☘️Ⓜ️' });
                    return;
                }
                targetUser = mentionedUsers[0];
            }

            const groupMetadata = await sock.groupMetadata(groupId);
            const groupAdmins = groupMetadata.participants
                .filter(p => p.admin)
                .map(admin => admin.id);

            if (!groupAdmins.includes(userJid)) {
                await sock.sendMessage(groupId, { text: '❌ You need admin privileges to use this command. ☘️Ⓜ️' });
                return;
            }
        }

        if (!warnedUsers[groupId]) {
            warnedUsers[groupId] = {};
        }

        if (!warnedUsers[groupId][targetUser]) {
            warnedUsers[groupId][targetUser] = 0;
        }

        warnedUsers[groupId][targetUser] += 1;
        const warningCount = warnedUsers[groupId][targetUser];
        const remainingWarns = 3 - warningCount;

        const warningMessage = `⚠️ *WARNING ALERT* ⚠️\n\n` +
                              `👤 *User:* @${targetUser.split('@')[0]}\n` +
                              `❗ *Warn Count:* ${warningCount}/3\n` +
                              `⏳ *Remaining Warnings Before Kick:* ${remainingWarns}\n\n` +
                              `🔥 *Reason:* ${text ? 'Please follow the group rules.' : 'Spamming detected!'} ☘️Ⓜ️`;

        await sock.sendMessage(groupId, { 
            text: warningMessage, 
            mentions: [targetUser] 
        });

        if (warningCount >= 3) {
            await sock.groupParticipantsUpdate(groupId, [targetUser], 'remove');
            await sock.sendMessage(groupId, { 
                text: `🚫 *USER REMOVED* 🚫\n\n` +
                      `👤 *User:* @${targetUser.split('@')[0]} has been removed after 3 warnings. ☘️Ⓜ️`, 
                mentions: [targetUser] 
            });
            delete warnedUsers[groupId][targetUser];
        }

        saveWarnings();
    } catch (error) {
        console.error('Error warning users:', error);
        await sock.sendMessage(chatJid, { text: '❌ Failed to process the warn command. Please try again. ☘️Ⓜ️' });
    }
};