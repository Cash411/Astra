const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

// File path for AFK settings
const AFK_FILE = path.join(__dirname, '../database/afk.json');

// Load AFK settings from file, default to empty object
const loadAfkSettings = () => {
    if (fs.existsSync(AFK_FILE)) {
        return JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
    }
    return {};
};

// Save AFK settings to file
const saveAfkSettings = (settings) => {
    fs.writeFileSync(AFK_FILE, JSON.stringify(settings, null, 2));
};

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();
    let afkSettings = loadAfkSettings();

    const args = text.slice(prefix.length).trim().split(/\s+/);
    if (args.length < 2) {
        await sock.sendMessage(chatJid, { 
            text: `❌ Usage: ${prefix}afk <on|off> [message]\nExample: ${prefix}afk on I’m AFK! ☘️Ⓜ️` 
        });
        return;
    }

    const action = args[1].toLowerCase();
    if (action === 'on') {
        const afkMsg = args.length > 2 ? args.slice(2).join(' ') : 'I’m currently AFK!';
        afkSettings[userJid] = { enabled: true, message: afkMsg, lastSeen: Date.now() };
        saveAfkSettings(afkSettings);
        await sock.sendMessage(chatJid, { text: `✅ AFK mode ON: "${afkMsg}" ☘️Ⓜ️` });
    } else if (action === 'off') {
        if (afkSettings[userJid]) {
            delete afkSettings[userJid];
            saveAfkSettings(afkSettings);
        }
        await sock.sendMessage(chatJid, { text: '✅ AFK mode OFF! ☘️Ⓜ️' });
    } else {
        await sock.sendMessage(chatJid, { text: '❌ Invalid action! Use on or off. ☘️Ⓜ️' });
    }
};