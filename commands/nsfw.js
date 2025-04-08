const fs = require('fs');
const path = require('path');
const { getPrefix } = require('./prefixHandler');

// Path to your NSFW images
const NSFW_DIR = path.join(__dirname, '../database/nsfw');

module.exports = async (sock, chatJid, text, msg, userJid) => {
    const prefix = await getPrefix();

    try {
        // Log current directory context
        console.log(`🔍 __dirname: ${__dirname}`);
        console.log(`🔍 Attempting NSFW_DIR: ${NSFW_DIR}`);

        // Verify directory exists
        if (!fs.existsSync(NSFW_DIR)) {
            console.log(`🔍 Directory check failed. Listing parent dir: ${path.dirname(NSFW_DIR)}`);
            try {
                const parentDirContents = fs.readdirSync(path.dirname(NSFW_DIR));
                console.log(`🔍 Parent dir contents: ${parentDirContents.length ? parentDirContents.join(', ') : 'empty'}`);
            } catch (parentError) {
                console.log(`🔍 Parent dir error: ${parentError.message}`);
            }
            throw new Error(`NSFW directory not found at: ${NSFW_DIR}. Create it and add images!`);
        }
        console.log(`🔍 NSFW_DIR exists: ${NSFW_DIR}`);

        // Get all image files
        let files;
        try {
            files = fs.readdirSync(NSFW_DIR)
                .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
        } catch (readError) {
            throw new Error(`Failed to read NSFW directory: ${readError.message}`);
        }
        console.log(`🔍 Files array: ${files && files.length ? files.join(', ') : 'empty or undefined'}`);

        if (!files || files.length === 0) {
            throw new Error('No valid images found in NSFW directory');
        }

        // Select random image
        const randomIndex = Math.floor(Math.random() * files.length);
        const randomFile = files[randomIndex];
        if (!randomFile) {
            throw new Error(`Random file selection failed. Files: ${files.join(', ')}`);
        }
        console.log(`🔍 Random file selected: ${randomFile}`);

        const imagePath = path.join(NSFW_DIR, randomFile);
        console.log(`🔍 Image path: ${imagePath}`);

        // Check if file exists and read it
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file missing: ${imagePath}`);
        }
        const imageBuffer = fs.readFileSync(imagePath);
        console.log(`🔍 Image buffer: ${imageBuffer ? `Buffer, ${imageBuffer.length} bytes` : 'undefined'}`);

        // Prepare message object
        const mimeType = path.extname(randomFile).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        const message = {
            image: imageBuffer, // Corrected syntax: no { buffer: } wrapper
            mimetype: mimeType,
            caption: '🚨 NSFW Content ☘️Ⓜ️',
            viewOnce: false
        };
        console.log(`🔍 Sending message: mimetype=${mimeType}, buffer length=${imageBuffer.length}`);

        // Send with optional view-once
        await sock.sendMessage(chatJid, message);
        console.log(`✅ NSFW image sent: ${randomFile}`);

    } catch (error) {
        console.error('NSFW Error:', error.message);
        await sock.sendMessage(chatJid, {
            text: `❌ Failed to fetch NSFW content: ${error.message} ☘️Ⓜ️`
        });
    }
};