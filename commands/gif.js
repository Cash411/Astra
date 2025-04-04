const { getPrefix } = require('./prefixHandler');
const fetch = require('node-fetch');

module.exports = async (sock, sender, text, msg) => {
    try {
        // Extract the search query from the message
        const query = text.slice(5).trim(); // Remove ".gif" and trim whitespace

        if (!query) {
            return await sock.sendMessage(sender, { text: '🔍 Please specify a search term for the GIF.\nExample: `.gif dancing` ☘️Ⓜ️' });
        }

        // Use a free GIF API (e.g., Giphy's public beta key)
        const url = `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=dc6zaTOxFJmzC&limit=1`;

        // Fetch GIF from Giphy
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            return await sock.sendMessage(sender, { text: '❌ No GIFs found for that search term. Try something else! ☘️Ⓜ️' });
        }

        // Get the first GIF URL
        const gifUrl = data.data[0].images.original.url;

        // Send the GIF
        await sock.sendMessage(sender, { image: { url: gifUrl }, caption: `🎥 Here is your GIF for *${query}* ☘️Ⓜ️` });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(sender, { text: '❌ Error retrieving GIF. Please try again later. ☘️Ⓜ️' });
    }
};
