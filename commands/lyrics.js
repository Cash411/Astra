const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

module.exports = async (sock, sender, text, msg) => {
    try {
        const prefix = await getPrefix();
        const songQuery = text.split(' ').slice(1).join(' ').trim();

        if (!songQuery) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}lyrics <song title>\nExample: ${prefix}lyrics Shape of You\`\`\` ☘️Ⓜ️`
            });
        }

        // Show typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        // Enhanced API list with better fallbacks
        const apiAttempts = [
            {
                name: "GeniusScraper",
                url: `https://some-random-api.com/lyrics?title=${encodeURIComponent(songQuery)}`
            },
            {
                name: "LyricsOVH",
                url: `https://api.lyrics.ovh/v1/${encodeURIComponent(songQuery.replace(/ /g, '%20'))}`
            },
            {
                name: "AZLyricsScraper",
                url: `https://api.lyrics.ovh/suggest/${encodeURIComponent(songQuery)}`
            }
        ];

        let lyrics;
        for (const api of apiAttempts) {
            try {
                const { data } = await axios.get(api.url, { timeout: 10000 });
                
                if (api.name === "GeniusScraper" && data.lyrics) {
                    lyrics = data.lyrics;
                    break;
                } else if (api.name === "LyricsOVH" && data.lyrics) {
                    lyrics = data.lyrics;
                    break;
                } else if (api.name === "AZLyricsScraper" && data.data?.length > 0) {
                    // Try first suggested result
                    const primaryResult = data.data[0];
                    const { data: lyricsData } = await axios.get(
                        `https://api.lyrics.ovh/v1/${primaryResult.artist.name}/${primaryResult.title}`
                    );
                    if (lyricsData.lyrics) {
                        lyrics = lyricsData.lyrics;
                        break;
                    }
                }
            } catch (err) {
                console.warn(`${api.name} failed:`, err.message);
            }
        }

        if (!lyrics) {
            // Final fallback: Manual search instructions
            return await sock.sendMessage(sender, {
                text: `\`\`\`🔍 Lyrics Not Found\n\nTry searching manually:\n1. https://genius.com/search?q=${encodeURIComponent(songQuery)}\n2. https://www.azlyrics.com/lyrics/${encodeURIComponent(songQuery.replace(/ /g, ''))}.html\`\`\` ☘️Ⓜ️`
            });
        }

        // Format lyrics (WhatsApp has 4096 character limit)
        const MAX_LENGTH = 3000;
        const formattedLyrics = lyrics.length > MAX_LENGTH 
            ? `${lyrics.substring(0, MAX_LENGTH)}...\n[TRUNCATED - Full lyrics at source]` 
            : lyrics;

        await sock.sendMessage(sender, {
            text: `\`\`\`🎵 Lyrics for "${songQuery}":\n\n${formattedLyrics}\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Lyrics error:', error);
        await sock.sendMessage(sender, {
            text: `\`\`\`❌ Couldn't fetch lyrics\n\nTry:\n1. More specific query\n2. "Artist - Song" format\n3. Manual search: https://genius.com/search\`\`\` ☘️Ⓜ️`
        });
    }
};