const { statusViewer } = require('../server');
const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    const args = text.trim().split(' ').slice(1);
    const action = args[0]?.toLowerCase();

    try {
        if (!statusViewer.sock) {
            statusViewer.initialize(sock);
            console.log('🔧 Command handler initialized sock');
        }

        if (action === 'on') {
            statusViewer.toggle(true);
            return sock.sendMessage(sender, { 
                text: '```✅ Status viewer enabled``` ☘️Ⓜ️'
            });
        }

        if (action === 'off') {
            statusViewer.toggle(false);
            return sock.sendMessage(sender, { 
                text: '```✅ Status viewer disabled``` ☘️Ⓜ️'
            });
        }

        if (action === 'dl') {
            statusViewer.setDownload(true);
            return sock.sendMessage(sender, { 
                text: '```✅ Viewing and downloading enabled``` ☘️Ⓜ️'
            });
        }

        if (action === 'no-dl') {
            statusViewer.setDownload(false);
            return sock.sendMessage(sender, { 
                text: '```✅ Viewing only (no download) enabled``` ☘️Ⓜ️'
            });
        }

        if (action === 'emoji') {
            const emoji = args[1];
            if (!emoji) {
                return sock.sendMessage(sender, { 
                    text: '```❌ Please provide an emoji (e.g., .status emoji 👍)``` ☘️Ⓜ️'
                });
            }
            statusViewer.setReactionEmoji(emoji);
            return sock.sendMessage(sender, { 
                text: '```✅ Status reaction set to: ' + emoji + '``` ☘️Ⓜ️'
            });
        }

        // Default: show status + help
        const status = statusViewer.getStatus();
        await sock.sendMessage(sender, { 
            text: status + ' ☘️Ⓜ️\n\n' +
                  '```Usage:```\n' +
                  '```.astatus on      - Enable status viewer```\n' +
                  '```.astatus off     - Disable status viewer```\n' +
                  '```.astatus dl      - View and download statuses```\n' +
                  '```.astatus no-dl   - View only (no download)```\n' +
                  '```.astatus emoji <emoji> - React with emoji```'
        });

    } catch (error) {
        console.error('Status viewer command error:', error.message);
        await sock.sendMessage(sender, { 
            text: '```❌ Operation failed: ' + error.message + '``` ☘️Ⓜ️'
        });
    }
};