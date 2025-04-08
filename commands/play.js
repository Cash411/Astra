const fsPromises = require('node:fs/promises');
const yts = require('yt-search');
const { downloadAudio, cleanup } = require('../lib/downloader');

function secondString(seconds) {
    seconds = Number(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`.trim();
}

module.exports = async (sock, sender, text, msg) => {
    console.log('🎵 Starting .play command');
    const songName = text.split(' ').slice(1).join(' ').trim();
    if (!songName) {
        console.log('❌ No song name provided');
        await sock.sendMessage(sender, { text: '```Usage: .play <song name> ☘️Ⓜ️```' });
        return;
    }

    try {
        console.log(`🔍 Searching YouTube for: ${songName}`);
        const searchResults = await yts({ query: songName, hl: 'en', gl: 'US' });
        const video = searchResults.videos[0];
        if (!video) {
            console.log('❌ Song not found');
            await sock.sendMessage(sender, { text: '```No song found on YouTube ☘️Ⓜ️```' });
            return;
        }

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        console.log(`🎥 Found video: ${videoUrl}`);

        const txt = '```\n' +
                    '✨ ASTRA PLAYER ✨\n' +
                    `  🎧 Title: ${video.title}\n` +
                    `  ⏳ Duration: ${secondString(video.duration.seconds)}\n` +
                    `  📅 Posted: ${video.ago || 'Unknown'}\n` +
                    `  👤 Channel: ${video.author.name || 'Unknown'}\n` +
                    '  ⚡ Fetching audio...\n' +
                    '``` ☘️Ⓜ️';
        await sock.sendMessage(sender, { text: txt }, { quoted: msg });

        const audioFile = await downloadAudio(videoUrl, video.videoId);
        console.log('📤 Sending audio');
        const audioBuffer = await fsPromises.readFile(audioFile);
        const sentMsg = await sock.sendMessage(sender, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: false,
        }, { quoted: msg });
        console.log('✅ Audio sent:', sentMsg.key);

        await sock.sendMessage(sender, { text: '```🎉 Audio delivered! Enjoy ☘️Ⓜ️```' });
        await cleanup(audioFile);

    } catch (error) {
        console.error('Error in .play:', error);
        await sock.sendMessage(sender, { text: '```❌ Audio fetch failed: ' + error.message + ' ☘️Ⓜ️```' });
    }
};