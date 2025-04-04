const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const stream = require('stream');

const pipeline = promisify(stream.pipeline);

class TikTokHandler {
    constructor() {
        this.apiURL = 'https://tikwm.com/api/feed/search';
        this.headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
        };
    }

    async search(query, count = 3) { // Reduced to 3 videos to avoid rate limits
        try {
            const response = await axios.post(
                this.apiURL,
                new URLSearchParams({ 
                    keywords: query, 
                    count: count.toString(),
                    cursor: '0', 
                    HD: '1' 
                }),
                { headers: this.headers }
            );

            if (!response.data?.data?.videos?.length) {
                return { status: false, message: 'No videos found ☘️Ⓜ️' };
            }

            return {
                status: true,
                videos: response.data.data.videos.map(v => ({
                    title: v.title || 'No title ☘️Ⓜ️',
                    url: `https://www.tiktok.com/@${v.author?.unique_id}/video/${v.video_id}`,
                    video_url: v.play,
                    duration: v.duration
                }))
            };
        } catch (error) {
            console.error('TikTok API Error:', error);
            return { status: false, message: error.message + ' ☘️Ⓜ️' };
        }
    }

    async downloadVideo(url) {
        const tempFile = `./temp/tiktok_${Date.now()}.mp4`;
        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });

            await pipeline(
                response.data,
                fs.createWriteStream(tempFile)
            );

            return tempFile;
        } catch (error) {
            fs.unlink(tempFile, () => {});
            throw error;
        }
    }
}

const tiktok = new TikTokHandler();

module.exports = async (sock, sender, text, msg) => {
    try {
        const query = text.split('.tks ')[1]?.trim();
        if (!query) {
            await sock.sendMessage(sender, { 
                text: '```❌ Please specify a search term!\nExample: .tks Liverpool FC``` 🎥 ☘️Ⓜ️' 
            });
            return;
        }

        // Send processing message
        await sock.sendMessage(sender, { 
            text: '```🔍 Searching and downloading TikTok videos...\n⏳ This may take a moment``` 🎥 ☘️Ⓜ️' 
        });

        // Get TikTok videos
        const result = await tiktok.search(query, 3); // Limit to 3 videos
        
        if (!result.status) {
            return await sock.sendMessage(sender, { 
                text: `\`\`\`❌ TikTok Error: ${result.message}\`\`\` 🎥 ☘️Ⓜ️` 
            });
        }

        // Send videos one by one
        for (const video of result.videos) {
            try {
                const videoPath = await tiktok.downloadVideo(video.video_url);
                
                await sock.sendMessage(sender, {
                    video: fs.readFileSync(videoPath),
                    caption: `\`\`\`🎥 ${video.title}\n⏱️ ${video.duration}s\`\`\` ☘️Ⓜ️`,
                    mimetype: 'video/mp4'
                });

                // Cleanup
                fs.unlink(videoPath, () => {});
                
                // Add delay between sends to avoid flooding
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`Failed to send video: ${video.url}`, error);
                await sock.sendMessage(sender, { 
                    text: `\`\`\`⚠️ Couldn't send video: ${video.title}\n🔗 ${video.url}\`\`\` 🎥 ☘️Ⓜ️` 
                });
            }
        }

    } catch (error) {
        console.error('TikTok Command Error:', error);
        await sock.sendMessage(sender, { 
            text: '```❌ Critical error processing TikTok request!``` 🎥 ☘️Ⓜ️' 
        });
    }
};