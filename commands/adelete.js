const { getPrefix } = require('./prefixHandler');
const { proto } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// File path for adelete settings
const ADELETE_FILE = path.join(__dirname, '../database/adelete.json');

// Load adelete settings from file, default to initial state
const loadAdeleteSettings = () => {
    if (fs.existsSync(ADELETE_FILE)) {
        return JSON.parse(fs.readFileSync(ADELETE_FILE, 'utf8'));
    }
    return { enabled: false, sendToPersonal: false, ownerJid: null };
};

// Save adelete settings to file
const saveAdeleteSettings = (settings) => {
    fs.writeFileSync(ADELETE_FILE, JSON.stringify(settings, null, 2));
};

const messageCache = new Map(); // Stores messages by ID

// Format message content with a chill twist
const formatMessageContent = (content) => {
    if (!content) return `*Nothing to see here, oops!*`;
    if (content.conversation) return `*${content.conversation}*`;
    if (content.extendedTextMessage?.text) return `*${content.extendedTextMessage.text}*`;
    if (content.imageMessage) return `*[Pic]* ` + (content.imageMessage.caption ? `*${content.imageMessage.caption}*` : 'No caption, just a snap');
    if (content.videoMessage) return `*[Vid]* ` + (content.videoMessage.caption ? `*${content.videoMessage.caption}*` : 'No caption, just a clip');
    return `*[Weird one, huh?]*`;
};

// Main command handler
module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();
    let deleteConfig = loadAdeleteSettings();

    // Set owner JID if not already set (strip :device suffix)
    if (!deleteConfig.ownerJid && sock.user?.id) {
        deleteConfig.ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        saveAdeleteSettings(deleteConfig);
    }

    const args = text.slice(prefix.length).trim().split(/\s+/);
    const command = args[1]?.toLowerCase();

    // Handle command input
    if (!command) {
        await sock.sendMessage(chatJid, {
            text: `${prefix}adelete Usage:\n` +
                  `- ${prefix}adelete on: Catch those deletes\n` +
                  `- ${prefix}adelete off: Let ‘em slide\n` +
                  `- ${prefix}adelete p: Show here, loud & proud\n` +
                  `- ${prefix}adelete e: Send to my DM, low-key ☘️Ⓜ️`
        });
        return;
    }

    try {
        switch (command) {
            case 'on':
                deleteConfig.enabled = true;
                saveAdeleteSettings(deleteConfig);
                await sock.sendMessage(chatJid, { text: '🎯 Now catching deleted messages—pick p or e! ☘️Ⓜ️' });
                break;
            case 'off':
                deleteConfig.enabled = false;
                deleteConfig.sendToPersonal = false;
                saveAdeleteSettings(deleteConfig);
                await sock.sendMessage(chatJid, { text: '🛑 Done catching deletes. Chill mode on. ☘️Ⓜ️' });
                break;
            case 'p':
                deleteConfig.enabled = true;
                deleteConfig.sendToPersonal = false;
                saveAdeleteSettings(deleteConfig);
                await sock.sendMessage(chatJid, { text: '📍 Deletes popping up right here, big vibes! ☘️Ⓜ️' });
                break;
            case 'e':
                deleteConfig.enabled = true;
                deleteConfig.sendToPersonal = true;
                saveAdeleteSettings(deleteConfig);
                await sock.sendMessage(chatJid, { text: '✉️ Deletes heading to my DM, nice and quiet! ☘️Ⓜ️' });
                break;
            default:
                await sock.sendMessage(chatJid, { text: `❌ Huh? Use: ${prefix}adelete [on|off|p|e] ☘️Ⓜ️` });
        }
    } catch (error) {
        console.error('Error in adelete:', error);
        await sock.sendMessage(chatJid, { text: '❌ Oops, something broke. Try again! ☘️Ⓜ️' });
    }
};

// Handle deleted messages with custom outputs
module.exports.handleDelete = async (sock, update) => {
    const deleteConfig = loadAdeleteSettings();
    if (!deleteConfig.enabled || update.type !== 'delete') return;

    const { remoteJid, id } = update;
    const cachedMsg = messageCache.get(id);

    // Skip if it’s the bot’s own message
    if (cachedMsg?.key?.fromMe) {
        console.log(`🔍 Skipping self-deleted message ID: ${id}`);
        return;
    }

    const targetJid = deleteConfig.sendToPersonal ? deleteConfig.ownerJid : remoteJid;
    const content = cachedMsg ? formatMessageContent(cachedMsg.message) : `*Poof, no trace left!*`;
    
    // Get sender tag and group name (if applicable)
    const senderJid = cachedMsg?.key?.participant || remoteJid;
    const senderTag = `@${senderJid.split('@')[0]}`;
    let fromText = senderTag;
    let groupName = '';
    if (remoteJid.endsWith('@g.us')) {
        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            groupName = groupMetadata.subject;
            fromText = `*${groupName}* (${senderTag})`;
        } catch (error) {
            console.error('Error fetching group metadata:', error);
            fromText = `${senderTag} (some group)`;
            groupName = 'some group';
        }
    }

    // Different outputs based on p or e
    let messageText;
    if (deleteConfig.sendToPersonal) {
        // For .adelete e: Specific, chill, sent to owner DM
        const location = remoteJid.endsWith('@g.us') ? `in *${groupName}*` : 'in a DM';
        messageText = `Yo, ${senderTag} deleted this ${location}:\n${content} 😏`;
    } else {
        // For .adelete p: Loud, bold, same chat
        messageText = `🎊 *DELETED ALERT!* 🎊\n` +
                      `From: ${fromText}\n` +
                      `Message: ${content} 🎉`;
    }

    await sock.sendMessage(targetJid, { 
        text: `${messageText} ☘️Ⓜ️`,
        mentions: [senderJid] // Tag the sender
    });
};

// Cache incoming messages
module.exports.cacheMessage = (msg) => {
    if (msg.key?.id && msg.message) {
        messageCache.set(msg.key.id, { key: msg.key, message: msg.message });
        if (messageCache.size > 1000) {
            const oldestKey = messageCache.keys().next().value;
            messageCache.delete(oldestKey);
        }
        console.log(`🔍 Cached message ID: ${msg.key.id}, FromMe: ${msg.key.fromMe}`);
    }
};