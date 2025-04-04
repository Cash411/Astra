const { getPrefix } = require('./prefixHandler');  // Adjust path if necessary

module.exports = async (sock, sender, text) => {
    if (!text) return;  // If text is undefined or null, do nothing.

    const currentPrefix = await getPrefix() || '.';  // Get the current prefix

    // Check if the message starts with the correct command
    if (text.startsWith(currentPrefix + 'menu')) {
        const menu = `*Commands:* \n1. ${currentPrefix}ping - Check bot status\n2. ${currentPrefix}prefix - Change bot prefix`;
        await sock.sendMessage(sender, { text: menu });
    }
};
