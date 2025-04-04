const { getPrefix } = require('./prefixHandler');
const { downloadContentFromMessage, MessageType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = async (sock, sender, text, msg) => {
    try {
        if (!msg.message.imageMessage && !msg.message.videoMessage) {
            await sock.sendMessage(sender, { text: '❌ Please reply to an image or video with the command .sticker' });
            return;
        }

        let mediaMessage;
        let mediaType;
        
        // Check if the media is an image or video
        if (msg.message.imageMessage) {
            mediaMessage = msg.message.imageMessage;
            mediaType = MessageType.image;
        } else if (msg.message.videoMessage) {
            mediaMessage = msg.message.videoMessage;
            mediaType = MessageType.video;
        }

        // Download the media content
        const stream = await downloadContentFromMessage(mediaMessage, mediaType);
        const filePath = path.join(__dirname, 'temp', `media.${mediaType === MessageType.image ? 'jpg' : 'mp4'}`);

        // Create a writable stream to save the file
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);

        writeStream.on('finish', async () => {
            const stickerPath = path.join(__dirname, 'temp', 'sticker.webp');
            if (mediaType === MessageType.image) {
                // Convert image to sticker using WebP format
                exec(`cwebp -q 80 ${filePath} -o ${stickerPath}`, async (error) => {
                    if (error) {
                        await sock.sendMessage(sender, { text: '❌ Error converting image to sticker' });
                        return;
                    }
                    await sock.sendMessage(sender, { sticker: fs.readFileSync(stickerPath) });
                    fs.unlinkSync(filePath);
                    fs.unlinkSync(stickerPath); // Clean up temporary files
                });
            } else if (mediaType === MessageType.video) {
                // Convert video to sticker (GIF or WebP conversion)
                exec(`ffmpeg -i ${filePath} -vf "scale=256:256" -vcodec vp8 -an -y ${stickerPath}`, async (error) => {
                    if (error) {
                        await sock.sendMessage(sender, { text: '❌ Error converting video to sticker' });
                        return;
                    }
                    await sock.sendMessage(sender, { sticker: fs.readFileSync(stickerPath) });
                    fs.unlinkSync(filePath);
                    fs.unlinkSync(stickerPath); // Clean up temporary files
                });
            }
        });
    } catch (error) {
        console.error('❌ Error in .sticker command:', error);
        await sock.sendMessage(sender, { text: '❌ An error occurred while processing your sticker request.' });
    }
};
