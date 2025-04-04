const { getPrefix } = require('./prefixHandler');
const qrcode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');
const jsQR = require('jsqr');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('QR command triggered ☘️Ⓜ️');

        // Check if replying to an image
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImageReply = quotedMsg?.imageMessage;

        if (isImageReply) {
            // QR decode from replied image
            await sock.sendMessage(sender, {
                text: '```🔄 Decoding QR from image...``` ☘️Ⓜ️'
            });

            const buffer = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of buffer) {
                chunks.push(chunk);
            }
            const imageBuffer = Buffer.concat(chunks);

            // Process image with Jimp
            const image = await Jimp.read(imageBuffer);
            const qrImageData = {
                data: new Uint8ClampedArray(image.bitmap.data),
                width: image.bitmap.width,
                height: image.bitmap.height
            };

            // Decode QR
            const decodedQR = jsQR(qrImageData.data, qrImageData.width, qrImageData.height);

            if (decodedQR) {
                await sock.sendMessage(sender, {
                    text: `\`\`\`✅ Decoded QR content:\n${decodedQR.data}\`\`\` ☘️Ⓜ️`
                });
            } else {
                await sock.sendMessage(sender, {
                    text: '```❌ No QR code found in the image!``` ☘️Ⓜ️'
                });
            }
            return;
        }

        // Normal QR generation
        const content = text.split(' ').slice(1).join(' ').trim();
        if (!content) {
            await sock.sendMessage(sender, {
                text: '```❌ Please provide text/URL or reply to an image!\nUsage: .qr <text> OR reply .qr to an image``` ☘️Ⓜ️'
            });
            return;
        }

        // Generate QR code
        const qrBuffer = await qrcode.toBuffer(content, {
            scale: 8,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        await sock.sendMessage(sender, {
            image: qrBuffer,
            caption: `\`\`\`QR Code for:\n${content}\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('QR error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Error processing QR code!\nTry again later.``` ☘️Ⓜ️'
        });
    }
};