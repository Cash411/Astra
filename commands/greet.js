const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

// File path for greet settings
const GREET_FILE = path.join(__dirname, '../database/greet.json');

// Load greet settings from file, default to initial state
const loadGreetSettings = () => {
    if (fs.existsSync(GREET_FILE)) {
        return JSON.parse(fs.readFileSync(GREET_FILE, 'utf8'));
    }
    return { enabled: false, message: '', seenUsers: [] };
};

// Save greet settings to file
const saveGreetSettings = (settings) => {
    fs.writeFileSync(GREET_FILE, JSON.stringify(settings, null, 2));
};

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    // Restrict to DMs only
    if (chatJid.endsWith('@g.us')) {
        await sock.sendMessage(chatJid, { text: '❌ This command is for DMs only! ☘️Ⓜ️' });
        return;
    }

    // Load fresh settings
    let greetSettings = loadGreetSettings();

    // Parse command arguments
    const args = text.slice(prefix.length).trim().split(/\s+/);
    if (args.length < 2) {
        await sock.sendMessage(chatJid, { 
            text: `❌ Usage: ${prefix}greet <set|del|get|on|off> [message]\nExample: ${prefix}greet set Welcome! ☘️Ⓜ️` 
        });
        return;
    }

    const action = args[1].toLowerCase();
    switch (action) {
        case 'set':
            if (args.length < 3) {
                await sock.sendMessage(chatJid, { text: '❌ Provide a message to set! ☘️Ⓜ️' });
                return;
            }
            greetSettings.message = args.slice(2).join(' ');
            saveGreetSettings(greetSettings);
            await sock.sendMessage(chatJid, { 
                text: `✅ Greet message set to: "${greetSettings.message}" ☘️Ⓜ️` 
            });
            break;

        case 'del':
            greetSettings.message = '';
            saveGreetSettings(greetSettings);
            await sock.sendMessage(chatJid, { text: '✅ Greet message deleted! ☘️Ⓜ️' });
            break;

        case 'get':
            await sock.sendMessage(chatJid, { 
                text: `ℹ️ Current greet: "${greetSettings.message || 'None'}" | Enabled: ${greetSettings.enabled} ☘️Ⓜ️` 
            });
            break;

        case 'on':
            greetSettings.enabled = true;
            saveGreetSettings(greetSettings);
            await sock.sendMessage(chatJid, { text: '✅ Greet turned ON! ☘️Ⓜ️' });
            break;

        case 'off':
            greetSettings.enabled = false;
            saveGreetSettings(greetSettings);
            await sock.sendMessage(chatJid, { text: '✅ Greet turned OFF! ☘️Ⓜ️' });
            break;

        default:
            await sock.sendMessage(chatJid, { 
                text: '❌ Invalid action! Use set, del, get, on, or off. ☘️Ⓜ️' 
            });
    }
};