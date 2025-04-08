const { getPrefix } = require('./prefixHandler');
const os = require('os');

// Command categories
const categories = {
    Group: ['add', 'admins', 'demote', 'ginfo', 'gid', 'goodbye', 'gpp', 'inactivecheck', 'invite', 'kick', 'leave', 'promote', 'tagall', 'welcome'],
    Whatsapp: ['adelete', 'alock', 'antilink', 'antispam', 'astatus', 'block', 'cleanwarn', 'dlt', 'greet', 'mention', 'pinfo', 'sticker', 'tag', 'unblock', 'unlock', 'v2a'],
    Misc: ['calc', 'dice', 'fcoin', 'fpp', 'imgrandom', 'joke', 'livescore', 'lyrics', 'medialdl', 'meme', 'menu', 'movie', 'news', 'notes', 'online', 'ping', 'poll', 'prayer', 'qr', 'quote', 'reminder', 'save', 'shortcut', 'time', 'tks', 'translate', 'uptime', 'vidrandom', 'weather'],
    AI: ['astra', 'deepseek', 'gemini', 'groq'],
    Game: ['rank', 'rps', 'tictactoe']
};

// Bot control commands
const botControl = ['prefix','restart', 'shutdown',];

// Bot version
const BOT_VERSION = '1.0.0'; // Update this as needed

// Calculate runtime
const getRuntime = () => {
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

// Get current date and time
const getDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour12: true });
    return { date, time };
};

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = (await getPrefix()) || '.';

    // Skip if no text or not a menu command
    if (!text || !text.trim().startsWith(`${prefix}menu`)) return;

    // Get date and time
    const { date, time } = getDateTime();

    // Build the menu with enhanced block design
    const menuText = `
🌟 *ASTRA BOT* 🌟
╔══════════════════════╗
║  Version: ${BOT_VERSION}         ║
║  Prefix: \`${prefix}\`           ║
║  Runtime: ${getRuntime()}   ║
║  Date: ${date}         ║
║  Time: ${time}         ║
╚══════════════════════╝

┌─── ✦ *Commands* ✦ ───┐

*Group Commands* 🗣️
${categories.Group.map(cmd => `│ ✧ ${cmd}`).join('\n')}

*Whatsapp Commands* 📱
${categories.Whatsapp.map(cmd => `│ ✧ ${cmd}`).join('\n')}

*Misc Commands* 🛠️
${categories.Misc.map(cmd => `│ ✧ ${cmd}`).join('\n')}

*AI Commands* 🤖
${categories.AI.map(cmd => `│ ✧ ${cmd}`).join('\n')}

*Game Commands* 🎮
${categories.Game.map(cmd => `│ ✧ ${cmd}`).join('\n')}

*Bot Control* ⚙️
${botControl.map(cmd => `│ ✧ ${cmd}`).join('\n')}

└─── ✦ *Info* ✦ ───┘
Usage: \`${prefix}<command>\`
Example: \`${prefix}ping\`
Powered by Astra ☘️Ⓜ️
`.trim();

    // Send the menu
    try {
        await sock.sendMessage(chatJid, { text: menuText });
    } catch (error) {
        console.error('Menu Error:', error.message);
        await sock.sendMessage(chatJid, { text: '❌ Failed to send menu. Try again! ☘️Ⓜ️' });
    }
};