// commands/online.js
const { getPrefix } = require('./prefixHandler');
const onlineManager = require('../lib/onlineManager');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Online command triggered');
        
        // Extract arguments
        const args = text.trim().split(/\s+/);
        args.shift(); // Remove command name
        const subCommand = args[0]?.toLowerCase();
        
        if (subCommand === 'on') {
            // Enable always online mode
            await onlineManager.enableOnline(sock, sender);
            
            await sock.sendMessage(sender, { 
                text: '```✅ Always online mode enabled. You will appear online to others. ☘️Ⓜ️```' 
            });
            
        } else if (subCommand === 'off') {
            // Disable always online mode
            await onlineManager.disableOnline(sock);
            
            await sock.sendMessage(sender, { 
                text: '```✅ Always online mode disabled. Your online status will behave normally. ☘️Ⓜ️```' 
            });
            
        } else {
            // Show current status and help
            const isEnabled = onlineManager.getStatus();
            const status = isEnabled ? 'enabled' : 'disabled';
            
            await sock.sendMessage(sender, { 
                text: `\`\`\`ℹ️ Always online mode is currently ${status}.\n\nUsage:\n• .online on - to always appear online\n• .online off - to disable always online mode ☘️Ⓜ️\`\`\`` 
            });
        }
    } catch (error) {
        console.error('Error processing .online command:', error);
        await sock.sendMessage(sender, { 
            text: '```❌ Failed to process the .online command. Please try again. ☘️Ⓜ️```' 
        });
    }
};