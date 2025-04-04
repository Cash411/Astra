const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Meme command triggered');

        // Fetch a random meme from the API
        const response = await axios.get('https://meme-api.com/gimme');
        const memeData = response.data;

        // Validate the meme data
        if (!memeData || !memeData.url) {
            await sock.sendMessage(sender, { text: '❌ Failed to fetch a meme. Please try again later. ☘️Ⓜ️' });
            return;
        }

        // Send the meme image with caption
        await sock.sendMessage(sender, {
            image: { url: memeData.url }, // Send the meme image
            caption: `😂 *Here's your meme!* ☘️\n\n${memeData.title || 'No title available'}\n🌐 *From:* ${memeData.subreddit || 'Unknown subreddit'} ☘️Ⓜ️`
        });
    } catch (error) {
        console.error('Error fetching meme:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to fetch a meme. Please try again later. ☘️'});
    
    }
};   