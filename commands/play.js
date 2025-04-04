const ytdl = require('ytdl-core');
const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    const prefix = await getPrefix();
    const query = text.split(' ').slice(1).join(' ').trim();

    try {
        if (!query) {
            return sock.sendMessage(sender, {
                text: `\`\`\`❌ Please provide a song name or YouTube URL!\nExample: ${prefix}play Shape of You\`\`\` ☘️Ⓜ️`
            });
        }

        // Search for the video
        const videoInfo = await ytdl.getInfo(query);
        const videoTitle = videoInfo.videoDetails.title;
        const videoUrl = videoInfo.videoDetails.video_url;

        // Generate audio stream
        const audioStream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });

        // Host the file temporarily (you can use a service like ngrok or a cloud storage bucket)
        const tempFilePath = `./downloads/${videoTitle.replace(/[\/\\?%*:|"<>]/g, '-')}.mp3`;
        audioStream.pipe(fs.createWriteStream(tempFilePath));

        // Wait for the file to finish downloading
        await new Promise((resolve, reject) => {
            audioStream.on('end', resolve);
            audioStream.on('error', reject);
        });

        // Send the audio file
        await sock.sendMessage(sender, {
            document: fs.readFileSync(tempFilePath),
            fileName: `${videoTitle}.mp3`,
            mimetype: 'audio/mpeg'
        });

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);

        // Confirmation message
        await sock.sendMessage(sender, {
            text: `\`\`\`✅ Successfully sent: ${videoTitle}\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('YouTube download error:', error);
        await sock.sendMessage(sender, {
            text: `\`\`\`❌ Failed to download the song.\n\n${error.message}\`\`\` ☘️Ⓜ️`
        });
    }
};