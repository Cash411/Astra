const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

// File path for mention settings
const MENTION_FILE = path.join(__dirname, '../database/mention.json');

// Load mention settings from file, default to empty object
const loadMentionSettings = () => {
    if (fs.existsSync(MENTION_FILE)) {
        return JSON.parse(fs.readFileSync(MENTION_FILE, 'utf8'));
    }
    return {};
};

// Save mention settings to file
const saveMentionSettings = (settings) => {
    fs.writeFileSync(MENTION_FILE, JSON.stringify(settings, null, 2));
};

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();
    const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Load fresh settings for each command run
    const mentionSettings = loadMentionSettings();

    // Parse command arguments
    const args = text.slice(prefix.length).trim().split(/\s+/);
    if (args.length < 2) {
        await sock.sendMessage(chatJid, { 
            text: `❌ Usage: ${prefix}mention <message>\nExample: ${prefix}mention Hey boss, you’ve been tagged! ☘️Ⓜ️` 
        });
        return;
    }

    // Set new mention message
    const mentionMsg = args.slice(1).join(' ');
    const targetJid = chatJid.endsWith('@g.us') ? chatJid : 'global';
    mentionSettings[targetJid] = { message: mentionMsg, enabled: mentionSettings[targetJid]?.enabled ?? true }; // Keep enabled state or default to true
    saveMentionSettings(mentionSettings);

    // Confirm setting
    await sock.sendMessage(chatJid, { 
        text: `✅ Mention message set to: "${mentionMsg}" ☘️Ⓜ️` 
    });
};