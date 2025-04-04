const { getPrefix } = require('./prefixHandler');
const { downloadContentFromMessage } = require('@adiwajshing/baileys');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('VV command triggered');

        // Check if the message is a reply
        const repliedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!repliedMessage) {
            await sock.sendMessage(sender, { 
                text: '❌ Please reply to a "View Once" image, video, or audio to use this command. ☘️Ⓜ️' 
            });
            return;
        }

        // Extract the media type (image, video, or audio)
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
        const mediaType = mediaTypes.find(type => repliedMessage[type]);
        if (!mediaType) {
            await sock.sendMessage(sender, { 
                text: '❌ The replied message does not contain an image, video, or audio. ☘️Ⓜ️' 
            });
            return;
        }

        // Extract the media message
        const mediaMessage = repliedMessage[mediaType];

        // Download the media using downloadContentFromMessage
        const bufferArray = [];
        const stream = await downloadContentFromMessage(mediaMessage, mediaType.split('Message')[0]);
        for await (const chunk of stream) {
            bufferArray.push(chunk);
        }
        const buffer = Buffer.concat(bufferArray);

        // Resend the media without the "View Once" flag
        await sock.sendMessage(sender, {
            [mediaType.split('Message')[0]]: buffer, // Use the media type (e.g., image, video)
            caption: mediaMessage.caption || '',     // Include the original caption
            mimetype: mediaMessage.mimetype,        // Preserve the MIME type
            fileName: mediaMessage.fileName || undefined, // Preserve the file name (if any)
        });

        // Notify the user
        await sock.sendMessage(sender, { text: ' ☘️Ⓜ️' });
    } catch (error) {
        console.error('Error processing .vv command:', error);
        await sock.sendMessage(sender, { text: '❌ Failed to process the `.vv` command. Please try again. ☘️Ⓜ️' });
    }
};