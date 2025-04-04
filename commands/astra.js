const { getPrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text, msg) => {
    const prefix = await getPrefix();
    const botInfo = `
\`\`\`🤖 BOT INFORMATION

• Creator: ﾚのズﾉ ﾚのﾚﾑ 
• Version: 2.4.0
• Platform: Node.js ${process.version}
• Uptime: ${formatUptime(process.uptime())}
• Source: Private (Contact creator)
• Features: 50+ commands
• Support: ${prefix}support

☘️Ⓜ️ 
    `;

    await sock.sendMessage(sender, { text: botInfo });

    function formatUptime(seconds) {
        const days = Math.floor(seconds / (3600*24));
        seconds %= 3600*24;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }
};