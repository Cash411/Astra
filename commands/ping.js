const { getPrefix } = require('./prefixHandler'); // Ensure correct path

module.exports = async (sock, sender, text) => {
    const currentPrefix = await getPrefix() || '.';

    if (text.startsWith(`${currentPrefix}ping`)) {
        const startTime = Date.now();
        const response = await sock.sendMessage(sender, { text: 'Pinging...' });
        const endTime = Date.now();
        const ping = endTime - startTime;

        await sock.sendMessage(sender, { text: `Pong! 🏓 Response time: ${ping}ms` });
    }
};
