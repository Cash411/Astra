const { checkAndManageInactive } = require('../lib/groupManagement');
const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
        const prefix = await getPrefix();
        await sock.sendMessage(sender, { text: `\`\`\`❌ Command '${prefix}inactivecheck' can only be used in groups.\`\`\` ☘️Ⓜ️` });
        return;
    }

    const prefix = await getPrefix();
    const args = text.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (command !== 'inactivecheck') return;

    if (args.length < 1) {
        await sock.sendMessage(sender, { text: `\`\`\`⚠️ Usage: ${prefix}inactivecheck <days>\nOptions: 3, 7, 10, 20, 30\nExample: ${prefix}inactivecheck 7\`\`\` ☘️Ⓜ️` });
        return;
    }

    const inactiveDays = parseInt(args[0]);
    const validDays = [3, 7, 10, 20, 30];
    if (isNaN(inactiveDays) || !validDays.includes(inactiveDays)) {
        await sock.sendMessage(sender, { text: `\`\`\`⚠️ Please provide a valid number of days (3, 7, 10, 20, or 30).\`\`\` ☘️Ⓜ️` });
        return;
    }

    try {
        const groupId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        const groupMetadata = await sock.groupMetadata(groupId);
        
        console.log(`User ID: ${userId}`);
        console.log(`Participants:`, groupMetadata.participants.map(p => ({ id: p.id, admin: p.admin })));

        const isAdmin = groupMetadata.participants.some(p => p.id === userId && (p.admin === 'admin' || p.admin === 'superadmin'));
        const isBotAdmin = groupMetadata.participants.some(p => p.id === sock.user.id.split(':')[0] + '@s.whatsapp.net' && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isAdmin) {
            await sock.sendMessage(groupId, { text: `\`\`\`❌ Only group admins can use '${prefix}inactivecheck'.\`\`\` ☘️Ⓜ️` });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(groupId, { text: `\`\`\`❌ Bot needs to be an admin to perform this action.\`\`\` ☘️Ⓜ️` });
            return;
        }

        await sock.sendMessage(groupId, { text: `\`\`\`⚙️ Checking for members inactive for ${inactiveDays} day(s)...\`\`\` ☘️Ⓜ️` });
        await checkAndManageInactive(sock, groupId, inactiveDays);
        await sock.sendMessage(groupId, { text: `\`\`\`✅ Inactive member check completed.\`\`\` ☘️Ⓜ️` });

    } catch (error) {
        console.error('Error in inactivecheck command:', error);
        await sock.sendMessage(sender, { text: `\`\`\`❌ An error occurred while checking for inactive members.\`\`\` ☘️Ⓜ️` });
    }
};