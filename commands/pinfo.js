const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    const prefix = await getPrefix();
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
    const isGroup = msg.key.remoteJid.endsWith('@g.us');

    try {
        // Verify user exists
        const [userCheck] = await sock.onWhatsApp(mentionedJid);
        if (!userCheck?.exists) {
            return sock.sendMessage(sender, {
                text: '```❌ User not found on WhatsApp``` ☘️Ⓜ️'
            });
        }

        // Get profile data with fallbacks
        const status = await sock.fetchStatus(mentionedJid).catch(() => null);
        let groupRole = null;

        if (isGroup) {
            const metadata = await sock.groupMetadata(msg.key.remoteJid).catch(() => null);
            groupRole = metadata?.participants?.find(p => p.id === mentionedJid)?.admin || 'Member';
        }

        // Fetch profile picture URL
        let profilePicUrl = 'Not available';
        try {
            profilePicUrl = await sock.profilePictureUrl(mentionedJid, 'image');
        } catch (pfpError) {
            console.warn('Profile picture error:', pfpError.message);
            profilePicUrl = 'Private or not set';
        }

        // Format profile info
        const profileInfo = `
\`\`\`👤 USER PROFILE

• Name: ${userCheck.name || 'Not available'}
• Number: ${mentionedJid.replace('@s.whatsapp.net', '')}
• Status: ${status?.status || 'Not set'}
• About Updated: ${status?.setAt ? new Date(status.setAt).toLocaleString() : 'Never'}
${isGroup ? `• Group Role: ${groupRole}` : ''}
• Profile Picture: ${profilePicUrl}
• WhatsApp Join Date: ${await getJoinDate(sock, mentionedJid)}

💡 Tip: Some info depends on user's privacy settings\`\`\` ☘️Ⓜ️
        `;

        await sock.sendMessage(sender, { text: profileInfo });

    } catch (error) {
        console.error('Profile error:', error);
        await sock.sendMessage(sender, {
            text: `\`\`\`❌ Couldn't fetch profile\n\n${error.message}\`\`\` ☘️Ⓜ️`
        });
    }
};

// Helper to estimate account creation date
async function getJoinDate(sock, jid) {
    try {
        const status = await sock.fetchStatus(jid).catch(() => null);
        if (status?.setAt) {
            return new Date(status.setAt).toLocaleDateString();
        }
        return 'Unknown (privacy restricted)';
    } catch {
        return 'Unknown';
    }
}