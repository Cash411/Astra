const { getPrefix } = require('./prefixHandler');
const translate = require('@iamtraction/google-translate');

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Translate command triggered ☘️Ⓜ️');

        const prefix = await getPrefix();
        const commandText = text.trim().startsWith(prefix) ? text.slice(prefix.length).trim() : text.trim();
        const args = commandText.split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (command !== 'translate') return;

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const textToTranslate = quotedMsg 
            ? quotedMsg.conversation || quotedMsg.extendedTextMessage?.text
            : args.join(' ').trim();

        if (!textToTranslate) {
            console.log('❌ No text to translate');
            await sock.sendMessage(sender, { 
                text: `❌ No text to translate! Either reply to a message or type:\n\`${prefix}translate your text here\` ☘️Ⓜ️` 
            });
            return;
        }

        console.log(`🌍 Translating: "${textToTranslate}"`);
        const res = await translate(textToTranslate, { to: 'en' });

        await sock.sendMessage(sender, { 
            text: `🌍 *Translated to English:*\n${res.text}\n\n🔹 *Original:*\n${textToTranslate} ☘️Ⓜ️`,
            mentions: [msg.key.participant || sender]
        });

    } catch (error) {
        console.error('Translation error:', error);
        await sock.sendMessage(sender, { 
            text: '❌ Translation failed. Try again later! ☘️Ⓜ️' 
        });
    }
};