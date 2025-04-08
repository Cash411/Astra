const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

const ANTISPAM_FILE = path.join(__dirname, '../database/antispam.json');

// Load antispam settings or initialize
let antispamSettings = {};
if (fs.existsSync(ANTISPAM_FILE)) {
    try {
        const fileContent = fs.readFileSync(ANTISPAM_FILE, 'utf8');
        antispamSettings = fileContent.trim() ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error('Error parsing antispam.json:', error);
        antispamSettings = {};
    }
} else {
    fs.writeFileSync(ANTISPAM_FILE, '{}', 'utf8');
}

const saveAntispamSettings = () => {
    try {
        fs.writeFileSync(ANTISPAM_FILE, JSON.stringify(antispamSettings, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving antispam.json:', error);
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
    const action = args[1]?.toLowerCase();

    if (action === 'on') {
        antispamSettings[chatJid] = true;
        await sock.sendMessage(chatJid, { text: '✅ Antispam enabled! Spammers will be warned. ☘️Ⓜ️' });
    } else if (action === 'off') {
        antispamSettings[chatJid] = false;
        await sock.sendMessage(chatJid, { text: '✅ Antispam disabled! ☘️Ⓜ️' });
    } else {
        await sock.sendMessage(chatJid, { 
            text: `❌ Usage: ${prefix}antispam [on|off] ☘️Ⓜ️\nCurrent status: ${antispamSettings[chatJid] ? 'On' : 'Off'}` 
        });
        return;
    }

    saveAntispamSettings();
};