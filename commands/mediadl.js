const {
    downloadYouTube,
    downloadInstagram,
    downloadTikTok,
    downloadFacebook
} = require('../lib/mediaDownloader');

const { getPrefix } = require('./prefixHandler');

module.exports = async function handleDownloaderCommands(sock, msg, text, sender) {
    const prefix = await getPrefix(sender); // dynamically get prefix
    const reply = (message) => sock.sendMessage(sender, { text: message }, { quoted: msg });

    if (!text.startsWith(prefix)) return;

    const [fullCmd, platform, ...linkParts] = text.trim().split(' ');
    const command = fullCmd.slice(prefix.length);
    const link = linkParts.join(' ');

    if (command !== 'mediadl') return;

    if (!['yt', 'ig', 'tt', 'fb'].includes(platform) || !link) {
        return reply(`❗ Invalid usage.\nExample:\n${prefix}mediadl yt <url>\n${prefix}mediadl ig <url>\n${prefix}mediadl tt <url>\n${prefix}mediadl fb <url>`);
    }

    try {
        switch (platform) {
            case 'yt': {
                const videoLink = await downloadYouTube(link);
                return reply(`📥 YouTube Download Link:\n${videoLink}`);
            }

            case 'ig': {
                const mediaUrl = await downloadInstagram(link);
                return sock.sendMessage(sender, { video: { url: mediaUrl }, caption: '📥 Instagram Download' }, { quoted: msg });
            }

            case 'tt': {
                const mediaUrl = await downloadTikTok(link);
                return sock.sendMessage(sender, { video: { url: mediaUrl }, caption: '📥 TikTok Download' }, { quoted: msg });
            }

            case 'fb': {
                const mediaUrl = await downloadFacebook(link);
                return sock.sendMessage(sender, { video: { url: mediaUrl }, caption: '📥 Facebook Download' }, { quoted: msg });
            }

            default:
                return reply('❌ Unknown platform.');
        }
    } catch (err) {
        console.error(err);
        return reply('❌ Error downloading media. Please check the link or try again.');
    }
};
