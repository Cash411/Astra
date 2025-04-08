const { getPrefix } = require('./prefixHandler');

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
    if (args.length < 2 || !args[1]) {
        await sock.sendMessage(chatJid, { text: `❌ Usage: ${prefix}add <number>\nExample: ${prefix}add +201151197532 ☘️Ⓜ️` });
        return;
    }

    let number = args[1].replace(/[^0-9+]/g, ''); // Keep + for country code
    console.log(`🔍 Raw number: ${number}`);

    if (!number.startsWith('+')) {
        number = `+234${number}`; // Default to Nigeria if no country code
    }
    if (number.length < 7 || number.length > 16) { // + and 6-15 digits
        await sock.sendMessage(chatJid, { text: '❌ Invalid phone number! Must be 6-15 digits with country code. ☘️Ⓜ️' });
        return;
    }

    const jid = `${number.replace('+', '')}@s.whatsapp.net`;
    console.log(`🔍 Adding JID: ${jid}`);

    try {
        const result = await sock.groupParticipantsUpdate(chatJid, [jid], 'add');
        console.log(`✅ Add result:`, result);
        await sock.sendMessage(chatJid, { 
            text: `✅ Added @${number} to the group! ☘️Ⓜ️`,
            mentions: [jid]
        });
    } catch (error) {
        console.error('❌ Error adding participant:', error);
        let errorMsg = '❌ Failed to add the number. ';
        if (error.message?.includes('not-authorized')) {
            errorMsg += 'Bot needs admin privileges!';
        } else if (error.message?.includes('404')) {
            errorMsg += 'Number not found on WhatsApp!';
        } else if (error.message?.includes('bad-request')) {
            errorMsg += 'Invalid number format!';
        } else {
            errorMsg += 'Check the number or bot permissions.';
        }
        await sock.sendMessage(chatJid, { text: `${errorMsg} ☘️Ⓜ️` });
    }
};