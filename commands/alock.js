const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

const ALOCK_FILE = path.join(__dirname, '../database/alock.json');

// Load alock settings or initialize
let alockSettings = {};
if (fs.existsSync(ALOCK_FILE)) {
    try {
        const fileContent = fs.readFileSync(ALOCK_FILE, 'utf8');
        alockSettings = fileContent.trim() ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error('Error parsing alock.json:', error);
        alockSettings = {};
    }
} else {
    fs.writeFileSync(ALOCK_FILE, '{}', 'utf8');
}

const saveAlockSettings = () => {
    try {
        fs.writeFileSync(ALOCK_FILE, JSON.stringify(alockSettings, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving alock.json:', error);
    }
};

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    if (!chatJid.endsWith('@g.us')) {
        await sock.sendMessage(chatJid, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatJid);
    const groupAdmins = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id);

    if (!groupAdmins.includes(userJid)) {
        await sock.sendMessage(chatJid, { text: '❌ You need admin privileges to use this command! ☘️Ⓜ️' });
        return;
    }

    const args = text.slice(prefix.length).trim().split(/\s+/);
    if (args.length < 2) {
        await sock.sendMessage(chatJid, { 
            text: `❌ Usage: ${prefix}alock <lockTime-unlockTime> <timezone>\nExample: ${prefix}alock 22:00-06:00 UTC+1\nUse "off" to disable. ☘️Ⓜ️` 
        });
        return;
    }

    const timeArg = args[1];
    if (timeArg.toLowerCase() === 'off') {
        delete alockSettings[chatJid];
        saveAlockSettings();
        await sock.sendMessage(chatJid, { text: '✅ Auto-lock disabled! ☘️Ⓜ️' });
        return;
    }

    const [lockTime, unlockTime] = timeArg.split('-');
    const timezone = args[2];

    if (!lockTime || !unlockTime || !timezone || !timezone.match(/^UTC[+-]\d{1,2}$/)) {
        await sock.sendMessage(chatJid, { 
            text: `❌ Invalid format! Use ${prefix}alock HH:MM-HH:MM UTC±N\nExample: ${prefix}alock 22:00-06:00 UTC+1 ☘️Ⓜ️` 
        });
        return;
    }

    if (!lockTime.match(/^\d{2}:\d{2}$/) || !unlockTime.match(/^\d{2}:\d{2}$/)) {
        await sock.sendMessage(chatJid, { text: '❌ Times must be in HH:MM format (e.g., 22:00)! ☘️Ⓜ️' });
        return;
    }

    alockSettings[chatJid] = { lockTime, unlockTime, timezone };
    saveAlockSettings();

    await sock.sendMessage(chatJid, { 
        text: `✅ Auto-lock set! Group will lock at ${lockTime} and unlock at ${unlockTime} (${timezone}). ☘️Ⓜ️` 
    });
};