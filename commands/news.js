const { getPrefix } = require('./prefixHandler');
const axios = require('axios');
require('dotenv').config();

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();
    const apiKey = process.env.NEWSAPI_KEY;

    if (!apiKey) {
        await sock.sendMessage(chatJid, { text: '❌ NewsAPI key not set in .env! ☘️Ⓜ️' });
        return;
    }

    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 3); // Top 3
        let newsText = '📰 Latest News:\n';
        articles.forEach((a, i) => {
            newsText += `${i + 1}. ${a.title}\n${a.url}\n\n`;
        });
        await sock.sendMessage(chatJid, { text: `${newsText}☘️Ⓜ️` });
    } catch (error) {
        console.error('❌ News fetch error:', error);
        await sock.sendMessage(chatJid, { text: '❌ Failed to fetch news. Check API key or try later! ☘️Ⓜ️' });
    }
};