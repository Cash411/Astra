const { getPrefix } = require('./prefixHandler');
const moment = require('moment-timezone');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Time command triggered ☘️Ⓜ️');
        
        // Get current prefix
        const prefix = await getPrefix();
        
        // Extract location/timezone from command
        const query = text.split(' ').slice(1).join(' ').trim();
        if (!query) {
            await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}time <country/timezone>\nExample: ${prefix}time Japan\nExample: ${prefix}time UTC\`\`\` ☘️Ⓜ️`
            });
            return;
        }

        // Find matching timezones
        const timezones = moment.tz.names().filter(tz => 
            tz.toLowerCase().includes(query.toLowerCase()) || 
            tz.split('/').pop().toLowerCase().includes(query.toLowerCase())
        );

        if (timezones.length === 0) {
            await sock.sendMessage(sender, {
                text: `\`\`\`❌ No matching timezone found!\nTry ${prefix}time list\`\`\` ☘️Ⓜ️`
            });
            return;
        }

        // Handle list command
        if (query.toLowerCase() === 'list') {
            const allTimezones = moment.tz.names();
            await sock.sendMessage(sender, {
                text: `\`\`\`⏰ Available timezones (${allTimezones.length}):\n\n` +
                      `${allTimezones.join('\n').substring(0, 4000)}\`\`\` ☘️Ⓜ️`
            });
            return;
        }

        // Format time information
        const timeInfo = timezones.slice(0, 3).map(tz => {
            return `⏰ ${tz}\n   ${moment().tz(tz).format('YYYY-MM-DD HH:mm:ss (Z)')}`;
        }).join('\n\n');

        await sock.sendMessage(sender, {
            text: `\`\`\`🌍 Current Time\n\n${timeInfo}\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Time command error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Time service unavailable! Try again later.``` ☘️Ⓜ️'
        });
    }
};