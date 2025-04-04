const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const loadCommands = require('./commandsHandler');
const { getPrefix } = require('./commands/prefixHandler');
const fs = require('fs');
const path = require('path');

// Create and clean temp directory function
function setupTempDirectory() {
    const tempDir = path.join(__dirname, 'temp');
    
    try {
        // Remove temp directory if it exists
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log('🧹 Cleaned up existing temp directory');
        }
        
        // Create fresh temp directory
        fs.mkdirSync(tempDir);
        console.log('📁 Created temp directory for media storage');
        
        // Add .gitkeep file to maintain directory structure in git
        fs.writeFileSync(path.join(tempDir, '.gitkeep'), '');
    } catch (error) {
        console.error('❌ Failed to setup temp directory:', error);
        process.exit(1); // Exit if we can't setup temp directory
    }
}

async function startBot() {
    // Setup temp directory before anything else
    setupTempDirectory();

    const auth = await useMultiFileAuthState('./auth');

    let sock = makeWASocket({
        auth: auth.state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', auth.saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            console.log(`Connection closed. Reconnecting...`);
            setTimeout(startBot, 5000);
        }

        if (connection === 'open') {
            console.log('✅ Bot is now online!');
        }
    });

    const commands = loadCommands();

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) return;

        console.log(`📥 Received: ${text} from ${sender}`);

        const currentPrefix = await getPrefix();
        console.log(`🔹 Loaded Prefix: ${currentPrefix}`);

        if (!text.startsWith(currentPrefix)) return;

        const args = text.slice(currentPrefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        console.log(`🛠 Extracted Command: ${commandName}`);
        console.log(`🛠 Arguments: ${args.join(' ')}`);

        if (!msg || !msg.key || !msg.key.remoteJid) {
            console.error('❌ Invalid message object:', msg);
            await sock.sendMessage(sender, { text: '❌ Unable to process your request. Please try again.' });
            return;
        }

        if (commands[commandName]) {
            try {
                await commands[commandName](sock, sender, text, msg);
            } catch (error) {
                console.error(`❌ Error executing command '${commandName}':`, error);
                await sock.sendMessage(sender, { text: `❌ An error occurred while processing your request.` });
            }
        } else {
            console.log(`❌ Command '${commandName}' not found`);
            await sock.sendMessage(sender, { text: `❌ Command '${commandName}' not found` });
        }
    });

    // Cleanup on process exit
    process.on('SIGINT', () => {
        console.log('\n🧹 Cleaning up before exit...');
        try {
            fs.rmSync(path.join(__dirname, 'temp'), { recursive: true, force: true });
            console.log('✅ Temp directory cleaned');
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to cleanup temp directory:', error);
            process.exit(1);
        }
    });
}

startBot();