const { getPrefix } = require('./prefixHandler');
const translate = require('@vitalets/google-translate-api');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Translate command triggered ☘️Ⓜ️');

        // Check if the message is a reply
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const textToTranslate = quotedMsg 
            ? quotedMsg.conversation || quotedMsg.extendedTextMessage?.text
            : text.split(' ').slice(1).join(' ').trim(); // Remove ".translate"

        if (!textToTranslate) {
            await sock.sendMessage(sender, { 
                text: '❌ No text to translate! Either reply to a message or type:\n`.translate your text here` ☘️Ⓜ️' 
            });
            return;
        }

        // Translate to English (forced)
        const res = await translate(textToTranslate, { to: 'en' });

        // Send the result with original text
        await sock.sendMessage(sender, { 
            text: `🌍 *Translated to English:*\n${res.text}\n\n🔹 *Original:*\n${textToTranslate} ☘️Ⓜ️`,
            mentions: [msg.key.participant || sender] // Mention sender
        });

    } catch (error) {
        console.error('Translation error:', error);
        await sock.sendMessage(sender, { 
            text: '❌ Translation failed. Try again later! ☘️Ⓜ️' 
        });
    }
};