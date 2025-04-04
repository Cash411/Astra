const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Joke command triggered');

        // Fetch a random joke from the API
        const response = await axios.get('https://v2.jokeapi.dev/joke/Any');
        const jokeData = response.data;

        let jokeMessage = '';
        if (jokeData.type === 'single') {
            jokeMessage = jokeData.joke;
        } else if (jokeData.type === 'twopart') {
            jokeMessage = `${jokeData.setup}\n\n${jokeData.delivery}`;
        } else {
            jokeMessage = 'Oops! Something went wrong while fetching the joke.';
        }

        // Send the joke
        await sock.sendMessage(sender, { text: `😄 *Here's a joke for you:* ☘️\n\n${jokeMessage} ☘️Ⓜ️` });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to fetch a joke. Please try again later. ☘️Ⓜ️' });
    }
};