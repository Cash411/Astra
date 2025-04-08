const youtubedl = require('yt-dlp-exec');
const fsPromises = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, '../temp');

async function ensureTempDir() {
    try {
        await fsPromises.mkdir(TEMP_DIR, { recursive: true });
        console.log('📁 Temp directory ensured');
    } catch (error) {
        console.error('Failed to create temp directory:', error);
        throw error;
    }
}

async function retryWithDelay(fn, retries = 3, delayMs = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (error.message?.includes('429') && attempt < retries) {
                console.log(`⚠️ Attempt ${attempt} failed with 429. Retrying in ${delayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
                throw error;
            }
        }
    }
}

async function downloadAudio(url, videoId) {
    await ensureTempDir();
    const audioFile = path.join(TEMP_DIR, `${videoId}.mp4`);
    console.log('📥 Starting audio download');
    await retryWithDelay(() =>
        youtubedl(url, {
            format: 'bestaudio/best[ext=mp4]',
            output: audioFile,
            noCheckCertificate: true,
            noPlaylist: true,
        }, { timeout: 120000 })
    );
    console.log('✅ Audio downloaded');
    const fileStats = await fsPromises.stat(audioFile);
    console.log(`ℹ️ File size: ${fileStats.size} bytes`);
    if (fileStats.size < 100000) throw new Error('File too small—likely corrupted');
    return audioFile;
}

async function cleanup(audioFile) {
    await fsPromises.unlink(audioFile);
    console.log('🧹 Temp file removed');
}

module.exports = { downloadAudio, cleanup };