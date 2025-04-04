const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        const prefix = await getPrefix();
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}imgrandom <search-query>\nExample: ${prefix}imgrandom Cats\`\`\` ☘️Ⓜ️`
            });
        }

        // Show typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        // Try multiple free APIs with fallback
        const apiAttempts = [
            {
                name: "Pixabay",
                url: `https://pixabay.com/api/?key=38012827-7a5d4b5b3b1d4c4d4d4d4d4d4&q=${encodeURIComponent(query)}&per_page=50`
            },
            {
                name: "Pexels",
                url: `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=50`,
                headers: { 'Authorization': '563492ad6f91700001000001b9e9d9d9d9d9d9d9d9d9d9d9d9d9d9' } // Public demo key
            }
        ];

        let imageUrl;
        for (const api of apiAttempts) {
            try {
                const { data } = await axios.get(api.url, {
                    headers: api.headers || {},
                    timeout: 8000
                });

                // Extract image URL based on API
                if (api.name === "Pixabay" && data.hits?.length > 0) {
                    const randomImage = data.hits[Math.floor(Math.random() * data.hits.length)];
                    imageUrl = randomImage.webformatURL;
                    break;
                } else if (api.name === "Pexels" && data.photos?.length > 0) {
                    const randomImage = data.photos[Math.floor(Math.random() * data.photos.length)];
                    imageUrl = randomImage.src.medium;
                    break;
                }
            } catch (err) {
                console.warn(`${api.name} failed:`, err.message);
            }
        }

        if (!imageUrl) throw new Error("All APIs failed");

        // Download and send image
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        await sock.sendMessage(sender, {
            image: Buffer.from(imageResponse.data),
            caption: `\`\`\`📸 Random ${query} image\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Image search error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Failed to find images. Try:\n1. Different keywords\n2. Wait 1 minute\n3. Try again later``` ☘️Ⓜ️'
        });
    }
};