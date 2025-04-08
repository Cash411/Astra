const fs = require('fs').promises;
const path = require('path');

const warningsFile = path.join(__dirname, '../database/warnings.json');

async function loadWarnings() {
    try {
        const data = await fs.readFile(warningsFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error('Error loading warnings:', error);
        return {};
    }
}

async function saveWarnings(warnings) {
    try {
        await fs.writeFile(warningsFile, JSON.stringify(warnings, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving warnings:', error);
    }
}

async function warnUser(sock, groupId, userId) {
    let warnings = await loadWarnings();
    if (!warnings[groupId]) {
        warnings[groupId] = {};
    }
    warnings[groupId][userId] = (warnings[groupId][userId] || 0) + 1;
    await saveWarnings(warnings);
    const warningMessage = `⚠️ @${userId.split('@')[0]}, you have received a warning. (${warnings[groupId][userId]} warnings total)`;
    await sock.sendMessage(groupId, { text: warningMessage, mentions: [userId] });
}

async function kickUser(sock, groupId, userId) {
    try {
        await sock.groupParticipantsRemove(groupId, [userId]);
        await sock.sendMessage(groupId, { text: `✅ Kicked @${userId.split('@')[0]}.`, mentions: [userId] });
    } catch (error) {
        console.error('Error kicking user:', error);
        await sock.sendMessage(groupId, { text: `❌ Failed to kick @${userId.split('@')[0]}. Make sure I am an admin.`, mentions: [userId] });
    }
}

async function addUser(sock, groupId, userId) {
    try {
        await sock.groupParticipantsAdd(groupId, [userId]);
        await sock.sendMessage(groupId, { text: `✅ Added @${userId.split('@')[0]}.`, mentions: [userId] });
    } catch (error) {
        console.error('Error adding user:', error);
        await sock.sendMessage(groupId, { text: `❌ Failed to add @${userId.split('@')[0]}. Make sure I have the permissions and the user's settings allow it.`, mentions: [userId] });
    }
}

async function getWarnCount(sock, groupId, userId, sender) {
    const warnings = await loadWarnings();
    const count = warnings[groupId]?.[userId] || 0;
    await sock.sendMessage(sender, { text: `@${userId.split('@')[0]} has ${count} warning(s).`, mentions: [userId] });
}

async function clearWarns(sock, groupId, userId) {
    let warnings = await loadWarnings();
    if (warnings[groupId] && warnings[groupId][userId]) {
        delete warnings[groupId][userId];
        await saveWarnings(warnings);
        await sock.sendMessage(groupId, { text: `✅ Cleared warnings for @${userId.split('@')[0]}.`, mentions: [userId] });
    } else {
        await sock.sendMessage(groupId, { text: `@${userId.split('@')[0]} has no warnings.`, mentions: [userId] });
    }
}

module.exports = { warnUser, kickUser, addUser, getWarnCount, clearWarns };