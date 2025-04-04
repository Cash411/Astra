const { getPrefix } = require('../commands/prefixHandler'); // Ensure correct path
const process = require('process'); // Required to access uptime

module.exports = async (sock, sender, text) => {
    let currentPrefix = "."; // Default prefix

    try {
        currentPrefix = await getPrefix(); // Get stored prefix
    } catch (error) {
        console.error("Error fetching prefix:", error);
    }

    if (text.startsWith(currentPrefix + "uptime")) {
        const uptimeInSeconds = process.uptime();
        const hours = Math.floor(uptimeInSeconds / 3600);
        const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeInSeconds % 60);

        const uptimeMessage = `Bot Uptime: ${hours}h ${minutes}m ${seconds}s`;
        await sock.sendMessage(sender, { text: uptimeMessage });
    }
};
