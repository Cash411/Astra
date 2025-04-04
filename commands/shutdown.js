const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('⛔ Shutting down the bot...');

        await sock.sendMessage(sender, { text: '⛔ Shutting down the bot... Please wait!' });

        // Terminate the process to shut down the bot
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in .shutdown command:', error);
        await sock.sendMessage(sender, { text: '❌ An error occurred while shutting down the bot.' });
    }
};
