const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('🔄 Restarting the bot...');

        await sock.sendMessage(sender, { text: '🔄 Restarting the bot... Please wait!' });

        // Terminate the process to trigger the restart
        process.exit();
    } catch (error) {
        console.error('❌ Error in .restart command:', error);
        await sock.sendMessage(sender, { text: '❌ An error occurred while restarting the bot.' });
    }
};
