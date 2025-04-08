const { getPrefix } = require('./prefixHandler');
const { startTicTacToe } = require('../lib/tictactoeGame');

module.exports = async (sock, chatJid, text, msg, userJid) => {
    try {
        console.log('🎮 Starting .tictactoe command');
        const prefix = await getPrefix();
        const commandText = text.trim().startsWith(prefix) ? text.slice(prefix.length).trim() : text.trim();
        const args = commandText.split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (command !== 'tictactoe') return;

        const challenger = userJid; // Use userJid from server.js
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const opponent = mentionedJid || (args[0]?.startsWith('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null);
        console.log(`🔍 Parsed challenger: ${challenger}, opponent: ${opponent || 'none'}`);

        if (!opponent) {
            console.log('❌ No opponent specified');
            await sock.sendMessage(chatJid, { 
                text: `🎮 Please mention a user (e.g., \`${prefix}tictactoe @user\`). ☘️Ⓜ️` 
            });
            return;
        }

        if (opponent === challenger) {
            console.log('❌ Self challenge');
            await sock.sendMessage(chatJid, { 
                text: '🎮 You can’t play against yourself! Mention someone else. ☘️Ⓜ️' 
            });
            return;
        }

        startTicTacToe(sock, challenger, opponent, chatJid);

    } catch (err) {
        console.error('Tictactoe error:', err.stack);
        await sock.sendMessage(chatJid, { text: '❌ Oops! Something went wrong. Try again later. ☘️Ⓜ️' });
    }
};