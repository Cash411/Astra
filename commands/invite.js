const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    const prefix = await getPrefix();
    const groupId = msg.key.remoteJid;

    if (!groupId.endsWith('@g.us')) {
        return sock.sendMessage(sender, {
            text: '```❌ This command only works in groups!``` ☘️Ⓜ️'
        });
    }

    try {
        const code = await sock.groupInviteCode(groupId);
        const inviteLink = `https://chat.whatsapp.com/${code}`;
        
        await sock.sendMessage(sender, {
            text: `\`\`\`🔗 Group Invite Link:\n\n${inviteLink}\n\nShare carefully!\`\`\` ☘️Ⓜ️`,
            detectLinks: false
        });
    } catch (error) {
        await sock.sendMessage(sender, {
            text: '```❌ Failed to generate link. Ensure I\'m an admin.``` ☘️Ⓜ️'
        });
    }
};