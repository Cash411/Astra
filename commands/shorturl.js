const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Shorten command triggered ☘️Ⓜ️');

        // Extract URL from command
        const url = text.split(' ')[1]?.trim();
        if (!url || !isValidUrl(url)) {
            await sock.sendMessage(sender, { 
                text: '```❌ Invalid URL!\nUsage: .shorten https://example.com``` ☘️Ⓜ️' 
            });
            return;
        }

        // Use TinyURL API (free, no API key needed)
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        const shortUrl = response.data;

        await sock.sendMessage(sender, { 
            text: `\`\`\`🔗 URL Shortener\n\nOriginal: ${url}\nShortened: ${shortUrl}\`\`\` ☘️Ⓜ️`,
            detectLinks: false // Prevents WhatsApp auto-preview
        });

    } catch (error) {
        console.error('Shorten error:', error);
        await sock.sendMessage(sender, { 
            text: '```❌ Failed to shorten URL!\nTry again later.``` ☘️Ⓜ️' 
        });
    }
};

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}