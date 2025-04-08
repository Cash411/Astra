const { getPrefix } = require('./prefixHandler');
const axios = require('axios');
require('dotenv').config();

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();
    const args = text.slice(prefix.length).trim().split(/\s+/);
    if (args.length < 2) {
        await sock.sendMessage(chatJid, { text: `❌ Usage: ${prefix}movie <title>\nExample: ${prefix}movie The Matrix ☘️Ⓜ️` });
        return;
    }

    const title = args.slice(1).join(' ');
    const apiKey = process.env.OMDB_API_KEY;

    if (!apiKey) {
        await sock.sendMessage(chatJid, { text: '❌ OMDB API key not set in .env! ☘️Ⓜ️' });
        return;
    }

    try {
        const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
        const movie = response.data;
        if (movie.Response === 'False') {
            await sock.sendMessage(chatJid, { text: `❌ Movie not found: ${movie.Error} ☘️Ⓜ️` });
            return;
        }
        const info = `🎬 *${movie.Title}* (${movie.Year})\n` +
                     `📝 ${movie.Plot}\n` +
                     `⭐ ${movie.imdbRating}/10\n` +
                     `👤 ${movie.Actors}\n` +
                     `🌐 ${movie.imdbID}`;
        await sock.sendMessage(chatJid, { text: `${info} ☘️Ⓜ️` });
    } catch (error) {
        console.error('❌ Movie fetch error:', error);
        await sock.sendMessage(chatJid, { text: '❌ Failed to fetch movie info. Check API key or try later! ☘️Ⓜ️' });
    }
};