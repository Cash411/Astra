// commands/welcome.js
const welcomeManager = require('../lib/welcomeManager');
const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Welcome command triggered');

        if (!sender.endsWith('@g.us')) {
            await sock.sendMessage(sender, {
                text: '🚫 This command can only be used in group chats.'
            });
            return;
        }

        const prefix = await getPrefix();
        const args = text.trim().split(/\s+/);
        args.shift(); // Remove command name
        const subCommand = args[0]?.toLowerCase();

        const currentSettings = welcomeManager.getWelcome(sender);

        if (subCommand === 'on') {
            welcomeManager.setWelcome(sender, true);
            await sock.sendMessage(sender, {
                text: '✅ Welcome messages are now **enabled** for this group.'
            });

        } else if (subCommand === 'off') {
            welcomeManager.setWelcome(sender, false);
            await sock.sendMessage(sender, {
                text: '❌ Welcome messages are now **disabled** for this group.'
            });

        } else if (subCommand === 'pfp') {
            const pfpType = args[1]?.toLowerCase();
            const action = args[2]?.toLowerCase();

            if (pfpType === 'user') {
                const enabled = action === 'on';
                welcomeManager.setWelcome(sender, undefined, undefined, enabled, undefined);
                await sock.sendMessage(sender, { text: `🖼️ Welcome user profile picture is now **${enabled ? 'enabled' : 'disabled'}** for this group.` }, { quoted: msg });
            } else if (pfpType === 'group') {
                const enabled = action === 'on';
                welcomeManager.setWelcome(sender, undefined, undefined, undefined, enabled);
                await sock.sendMessage(sender, { text: `🏞️ Welcome group profile picture is now **${enabled ? 'enabled' : 'disabled'}** for this group.` }, { quoted: msg });
            } else {
                await sock.sendMessage(sender, { text: `⚙️ Usage: \`${prefix}welcome pfp [user/group] [on/off]\`` }, { quoted: msg });
            }

        } else {
            if (args.length > 0) {
                const customMessage = text.slice(text.indexOf(args[0]));
                welcomeManager.setWelcome(sender, true, customMessage);
                await sock.sendMessage(sender, {
                    text: '✍️ Welcome message has been **updated** and **enabled**.'
                });
            } else {
                const status = currentSettings.enabled ? 'enabled' : 'disabled';
                const message = currentSettings.message;

                await sock.sendMessage(sender, {
                    text: `✨ Welcome Messages: **${status.toUpperCase()}**\n\n📄 Current Message:\n\`\`\`${message}\`\`\`\n\n⚙️ Usage:\n• \`${prefix}welcome on\` - Enable welcome messages\n• \`${prefix}welcome off\` - Disable welcome messages\n• \`${prefix}welcome [message]\` - Set custom welcome message (use @user and @group-name)\n• \`${prefix}welcome pfp user [on/off]\` - Enable/disable user profile picture\n• \`${prefix}welcome pfp group [on/off]\` - Enable/disable group profile picture`
                });
            }
        }
    } catch (error) {
        console.error('Error processing welcome command:', error);
        await sock.sendMessage(sender, {
            text: '⚠️ Failed to process the welcome command. Please try again.'
        });
    }
};