const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Quote command triggered');

        // Fetch a random quote from the API
        const response = await axios.get('https://zenquotes.io/api/random');
        const quoteData = response.data[0];

        const quoteMessage = `📖 *Quote:* ${quoteData.q}\n\n👤 *Author:* ${quoteData.a}`;

        // Send the quote
        await sock.sendMessage(sender, { text: `🌟 *Here's your daily dose of inspiration:* ☘️\n\n${quoteMessage} ☘️Ⓜ️` });
    } catch (error) {
        console.error('Error fetching quote:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to fetch a quote. Please try again later. ☘️Ⓜ️' });
    }
};