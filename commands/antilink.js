const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

const ANTILINK_FILE = path.join(__dirname, '../database/antilink.json');

// Load antilink settings or initialize
let antilinkSettings = {};
if (fs.existsSync(ANTILINK_FILE)) {
    try {
        const fileContent = fs.readFileSync(ANTILINK_FILE, 'utf8');
        antilinkSettings = fileContent.trim() ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error('Error parsing antilink.json:', error);
        antilinkSettings = {};
    }
} else {
    fs.writeFileSync(ANTILINK_FILE, '{}', 'utf8');
}

const saveAntilinkSettings = () => {
    try {
        fs.writeFileSync(ANTILINK_FILE, JSON.stringify(antilinkSettings, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving antilink.json:', error);
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
    const allowedLinks = args.slice(2).map(link => link.toLowerCase());

    if (action === 'on') {
        antilinkSettings[chatJid] = {
            enabled: true,
            allowed: allowedLinks.length > 0 ? allowedLinks : []
        };
        const allowedText = allowedLinks.length > 0 ? `Allowed links: ${allowedLinks.join(', ')}` : 'No links allowed.';
        await sock.sendMessage(chatJid, { text: `✅ Antilink enabled! ${allowedText} ☘️Ⓜ️` });
    } else if (action === 'off') {
        antilinkSettings[chatJid] = { enabled: false, allowed: [] };
        await sock.sendMessage(chatJid, { text: '✅ Antilink disabled! ☘️Ⓜ️' });
    } else {
        const current = antilinkSettings[chatJid] || { enabled: false, allowed: [] };
        const statusText = current.enabled 
            ? `On (Allowed: ${current.allowed.length > 0 ? current.allowed.join(', ') : 'None'})`
            : 'Off';
        await sock.sendMessage(chatJid, { 
            text: `❌ Usage: ${prefix}antilink [on|off] [allowed links]\nCurrent status: ${statusText} ☘️Ⓜ️` 
        });
        return;
    }

    saveAntilinkSettings();
};