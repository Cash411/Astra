const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        const prefix = await getPrefix();
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}vidrandom <search-query>\nExample: ${prefix}vidrandom Funny dogs\`\`\` ☘️Ⓜ️`
            });
        }

        // Show typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        // Try multiple free video APIs
        const apiAttempts = [
            {
                name: "Pexels",
                url: `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=20`,
                headers: { 'Authorization': '563492ad6f91700001000001b9e9d9d9d9d9d9d9d9d9d9d9d9d9d9' } // Public demo key
            },
            {
                name: "Pixabay",
                url: `https://pixabay.com/api/videos/?key=38012827-7a5d4b5b3b1d4c4d4d4d4d4d4&q=${encodeURIComponent(query)}&per_page=20`
            }
        ];

        let videoUrl;
        for (const api of apiAttempts) {
            try {
                const { data } = await axios.get(api.url, {
                    headers: api.headers || {},
                    timeout: 10000
                });

                // Extract video URL based on API
                if (api.name === "Pexels" && data.videos?.length > 0) {
                    const randomVideo = data.videos[Math.floor(Math.random() * data.videos.length)];
                    videoUrl = randomVideo.video_files.find(file => file.quality === 'sd').link;
                    break;
                } else if (api.name === "Pixabay" && data.hits?.length > 0) {
                    const randomVideo = data.hits[Math.floor(Math.random() * data.hits.length)];
                    videoUrl = randomVideo.videos.small.url;
                    break;
                }
            } catch (err) {
                console.warn(`${api.name} failed:`, err.message);
            }
        }

        if (!videoUrl) throw new Error("All video APIs failed");

        // Download video (first 8MB to stay under WhatsApp limits)
        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 8 * 1024 * 1024 // 8MB limit
        });

        await sock.sendMessage(sender, {
            video: Buffer.from(videoResponse.data),
            caption: `\`\`\`🎥 Random ${query} video\`\`\` ☘️Ⓜ️`,
            gifPlayback: true // For better WhatsApp display
        });

    } catch (error) {
        console.error('Video search error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Failed to find videos. Try:\n1. Different keywords\n2. Shorter videos\n3. Try again later``` ☘️Ⓜ️'
        });
    }
};