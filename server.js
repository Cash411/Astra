require('dotenv').config();
process.removeAllListeners('warning');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, proto } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const loadCommands = require('./commandsHandler');
const { handleDelete, cacheMessage } = require('./commands/adelete');
const { updatePoints } = require('./commands/rank');
const fs = require('fs');
const path = require('path');
const onlineManager = require('./lib/onlineManager');
const StatusAutoViewer = require('./lib/StatusAutoViewer');
const MessageSaver = require('./lib/MessageSaver');
const { handleTicTacToeUpdate } = require('./lib/tictactoeGame');

console.log('🧹 Clearing old auth...');

const statusViewer = new StatusAutoViewer(path.join(__dirname, 'config'));
const messageSaver = new MessageSaver(path.join(__dirname, 'config'));

// Load settings from database folder
const ANTISPAM_FILE = path.join(__dirname, 'database/antispam.json');
const ANTILINK_FILE = path.join(__dirname, 'database/antilink.json');
const ALOCK_FILE = path.join(__dirname, 'database/alock.json');
const MENTION_FILE = path.join(__dirname, 'database/mention.json');
const GREET_FILE = path.join(__dirname, 'database/greet.json');
const AFK_FILE = path.join(__dirname, 'database/afk.json');
const READ_FILE = path.join(__dirname, 'database/read.json');
const CALL_FILE = path.join(__dirname, 'database/call.json');
const ADELETE_FILE = path.join(__dirname, 'database/adelete.json')

let antispamSettings = {};
if (fs.existsSync(ANTISPAM_FILE)) {
    try {
        antispamSettings = JSON.parse(fs.readFileSync(ANTISPAM_FILE, 'utf8'));
        console.log('🔍 Antispam settings loaded:', antispamSettings);
    } catch (error) {
        console.error('Error loading antispam.json:', error);
    }
}

let antilinkSettings = {};
if (fs.existsSync(ANTILINK_FILE)) {
    try {
        antilinkSettings = JSON.parse(fs.readFileSync(ANTILINK_FILE, 'utf8'));
        console.log('🔍 Antilink settings loaded:', antilinkSettings);
    } catch (error) {
        console.error('Error loading antilink.json:', error);
    }
}

let alockSettings = {};
if (fs.existsSync(ALOCK_FILE)) {
    try {
        alockSettings = JSON.parse(fs.readFileSync(ALOCK_FILE, 'utf8'));
        console.log('🔍 Alock settings loaded:', alockSettings);
    } catch (error) {
        console.error('Error loading alock.json:', error);
    }
}


if (fs.existsSync(MENTION_FILE)) {
    try {
        mentionSettings = JSON.parse(fs.readFileSync(MENTION_FILE, 'utf8'));
        console.log('🔍 Mention settings loaded:', mentionSettings);
    } catch (error) {
        console.error('Error loading mention.json:', error);
    }
}


if (fs.existsSync(GREET_FILE)) {
    try {
        greetSettings = JSON.parse(fs.readFileSync(GREET_FILE, 'utf8'));
        console.log('🔍 Greet settings loaded:', greetSettings);
    } catch (error) {
        console.error('Error loading greet.json:', error);
    }
}


if (fs.existsSync(AFK_FILE)) {
    try {
        afkSettings = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
        console.log('🔍 AFK settings loaded:', afkSettings);
    } catch (error) {
        console.error('Error loading afk.json:', error);
    }
}

let readSettings = { enabled: false };
if (fs.existsSync(READ_FILE)) {
    try {
        readSettings = JSON.parse(fs.readFileSync(READ_FILE, 'utf8'));
        console.log('🔍 Read settings loaded:', readSettings);
    } catch (error) {
        console.error('Error loading read.json:', error);
    }
}

let callSettings = { enabled: false };
if (fs.existsSync(CALL_FILE)) {
    try {
        callSettings = JSON.parse(fs.readFileSync(CALL_FILE, 'utf8'));
        console.log('🔍 Call settings loaded:', callSettings);
    } catch (error) {
        console.error('Error loading call.json:', error);
    }
}

// Track messages for antispam
const messageTimestamps = new Map();

async function reactToMessage(sock, msg, emoji) {
    try {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
    } catch (error) {
        console.error(`❌ Failed to react with ${emoji}:`, error.stack);
    }
}

async function startBot(retryCount = 0) {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    console.log('📱 Starting QR connection...');
    console.log('⚠️ Cloud IDEs may disconnect after QR scan—retry if needed.');
    const sock = makeWASocket({
        auth: state,
        version,
        defaultQueryTimeoutMs: 120000,
        logger: require('pino')({ level: 'info' }),
        keepAliveIntervalMs: 15000,
        connectTimeoutMs: 60000,
        browser: ['AstraBot', 'Chrome', '22.04'],
    });

    sock.ev.on('creds.update', saveCreds);

    let reconnectAttempts = retryCount;
    const maxAttempts = 3;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        console.log(`🔄 Connection: ${connection || 'unknown'}`);
        if (qr) {
            console.log('📱 Scan this QR:');
            qrcode.generate(qr, { small: true });
            console.log('⏳ Waiting for scan...');
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.message || 'Unknown';
            console.log(`❌ Closed: ${reason}`);
            if (reason.includes('515') || reason.includes('Stream Errored') || reason.includes('Connection Closed')) {
                if (reconnectAttempts < maxAttempts) {
                    reconnectAttempts++;
                    const delay = Math.min(10000 * reconnectAttempts, 60000);
                    console.log(`🔄 Restart attempt ${reconnectAttempts}/${maxAttempts} in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    console.log('🔄 Restarting bot...');
                    try {
                        await startBot(reconnectAttempts);
                    } catch (error) {
                        console.error('❌ Restart failed:', error.stack);
                    }
                } else {
                    console.error('❌ Max restarts reached. Delete ./auth and retry.');
                    process.exit(1);
                }
            }
        }
        if (connection === 'open') {
            console.log('✅ Bot online!');
            try {
                await onlineManager.initializeOnlineStatus(sock);
                console.log('✅ Online manager initialized');
                statusViewer.initialize(sock);
                console.log('✅ Status viewer initialized');
                messageSaver.initialize(sock);
                console.log('✅ Message saver initialized');
                
                setInterval(async () => {
                    const now = new Date();
                    for (const [groupId, { lockTime, unlockTime, timezone }] of Object.entries(alockSettings)) {
                        const [lockHour, lockMin] = lockTime.split(':').map(Number);
                        const [unlockHour, unlockMin] = unlockTime.split(':').map(Number);
                        const offset = Number(timezone.replace('UTC', '').replace(':', '')) * 60 * 60 * 1000;
                        const localTime = new Date(now.getTime() + offset);
                        const currentHour = localTime.getUTCHours();
                        const currentMin = localTime.getUTCMinutes();

                        const isLockTime = currentHour === lockHour && currentMin === lockMin;
                        const isUnlockTime = currentHour === unlockHour && currentMin === unlockMin;

                        try {
                            const groupMetadata = await sock.groupMetadata(groupId);
                            const currentState = groupMetadata.announce ? 'announcement' : 'not_announcement';

                            if (isLockTime && currentState !== 'announcement') {
                                await sock.groupSettingUpdate(groupId, 'announcement');
                                await sock.sendMessage(groupId, { text: `🔒 Group auto-locked at ${lockTime} (${timezone})! Only admins can send messages. ☘️Ⓜ️` });
                            } else if (isUnlockTime && currentState === 'announcement') {
                                await sock.groupSettingUpdate(groupId, 'not_announcement');
                                await sock.sendMessage(groupId, { text: `🔓 Group auto-unlocked at ${unlockTime} (${timezone})! Everyone can send messages now. ☘️Ⓜ️` });
                            }
                        } catch (error) {
                            console.error(`❌ Error in alock for ${groupId}:`, error);
                        }
                    }
                }, 60000);
            } catch (error) {
                console.error('❌ Initialization failed:', error.stack);
            }
        }
    });

    const commands = loadCommands();

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;
    
        const chatJid = msg.key.remoteJid;
        const userJid = chatJid.endsWith('@g.us') ? msg.key.participant : msg.key.remoteJid;
        const ownerJid = sock.user?.id.split(':')[0] + '@s.whatsapp.net';
    
        // Cache message FIRST
        const { cacheMessage } = require('./commands/adelete');
        cacheMessage(msg);

        // Auto-read messages if enabled
        if (readSettings.enabled && !msg.key.fromMe) {
            await sock.readMessages([msg.key]);
        }

        // Antispam logic
        if (chatJid.endsWith('@g.us') && antispamSettings[chatJid] && !msg.key.fromMe) {
            const key = `${userJid}_${chatJid}`;
            const now = Date.now();
            let timestamps = messageTimestamps.get(key) || [];
            timestamps = timestamps.filter(ts => now - ts < 10000);
            timestamps.push(now);

            if (timestamps.length >= 3) {
                const warnCommand = require('./commands/warn');
                await warnCommand(sock, chatJid, '', msg);
                timestamps = [];
            }
            messageTimestamps.set(key, timestamps);
        }

        // Antilink logic
        if (chatJid.endsWith('@g.us') && antilinkSettings[chatJid]?.enabled && !msg.key.fromMe) {
            const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').toLowerCase();
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const links = text.match(urlRegex) || [];

            if (links.length > 0) {
                const allowed = antilinkSettings[chatJid].allowed || [];
                const isAllowed = links.every(link => allowed.some(a => link.includes(a)));

                if (!isAllowed) {
                    await sock.sendMessage(chatJid, { delete: msg.key });
                    await sock.sendMessage(chatJid, { 
                        text: `❌ Link detected from @${userJid.split('@')[0]} and deleted! ☘️Ⓜ️`,
                        mentions: [userJid]
                    });
                }
            }
        }

        // Mention logic (only in groups)
        if (chatJid.endsWith('@g.us')) {
            const mentionSettings = fs.existsSync(MENTION_FILE) ? JSON.parse(fs.readFileSync(MENTION_FILE, 'utf8')) : {};
            if (mentionSettings[chatJid]?.enabled && !msg.key.fromMe) {
                const textContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const manualMentions = textContent.match(/@(\d+)/g)?.map(m => m.replace('@', '') + '@s.whatsapp.net') || [];
                const allMentions = [...new Set([...mentionedJids, ...manualMentions])];
                console.log(`🔍 Mentions in ${chatJid}:`, allMentions, `Owner: ${ownerJid}`);
                if (allMentions.includes(ownerJid)) {
                    console.log(`🔊 Owner mentioned in ${chatJid}, sending: "${mentionSettings[chatJid].message}"`);
                    await sock.sendMessage(chatJid, { text: mentionSettings[chatJid].message });
                }
            }
        }
        
        // Greet logic for DMs
        if (!chatJid.endsWith('@g.us')) {
            const greetSettings = fs.existsSync(GREET_FILE) ? JSON.parse(fs.readFileSync(GREET_FILE, 'utf8')) : { enabled: false, message: '', seenUsers: [] };
            if (greetSettings.enabled && !msg.key.fromMe && !greetSettings.seenUsers.includes(userJid)) {
                await sock.sendMessage(chatJid, { text: greetSettings.message || 'Welcome to my DM! ☘️Ⓜ️' });
                greetSettings.seenUsers.push(userJid);
                fs.writeFileSync(GREET_FILE, JSON.stringify(greetSettings, null, 2));
            }
        }
        
        // AFK logic
        const afkSettings = fs.existsSync(AFK_FILE) ? JSON.parse(fs.readFileSync(AFK_FILE, 'utf8')) : {};
        if (afkSettings[userJid]?.enabled && !msg.key.fromMe) {
            await sock.sendMessage(chatJid, { 
                text: `${afkSettings[userJid].message} (AFK since ${new Date(afkSettings[userJid].lastSeen).toLocaleTimeString()}) ☘️Ⓜ️` 
            });
        }

        await handleTicTacToeUpdate(sock, msg);

        if (chatJid.endsWith('@g.us') && !msg.key.fromMe) {
            await updatePoints(chatJid, userJid, sock);
        }

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '[Media/No Text]';
        const timestamp = new Date(msg.messageTimestamp * 1000).toLocaleString();
    
        if (chatJid === 'status@broadcast') {
            await statusViewer.handleStatusUpdate(msg);
            return;
        }
    
        const { getPrefix } = require('./commands/prefixHandler');
        const prefix = await getPrefix();
        if (msg.key.fromMe && !text.startsWith(prefix)) return;
    
        console.log(`📩 [${timestamp}] ${userJid} says in ${chatJid}: "${text}"`);
        console.log(`🔧 Prefix: ${prefix}`);
    
        if (!text.startsWith(prefix)) return;
    
        const args = text.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        console.log(`🚀 Running command: ${commandName} ${args.length ? `with args: ${args.join(' ')}` : ''} by ${userJid} in ${chatJid}`);
    
        if (!commands[commandName]) {
            console.log(`❌ Command "${commandName}" not found`);
            await sock.sendMessage(chatJid, { text: `❌ Command '${commandName}' not found ☘️Ⓜ️` });
            await reactToMessage(sock, msg, '❌');
            return;
        }
    
        try {
            await commands[commandName](sock, chatJid, text, msg, userJid);
            console.log(`✅ "${commandName}" executed successfully by ${userJid}`);
            await reactToMessage(sock, msg, 'Ⓜ️');
        } catch (error) {
            console.error(`❌ "${commandName}" failed for ${userJid}:\n${error.stack}`);
            await sock.sendMessage(chatJid, { text: '❌ Command failed ☘️Ⓜ️' });
            await reactToMessage(sock, msg, '❌');
        }
    });

    sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            if (update.update?.status === proto.WebMessageInfo.Status.DELETED) {
                try {
                    await handleDelete(sock, {
                        type: 'delete',
                        remoteJid: update.key.remoteJid,
                        id: update.key.id,
                    });
                } catch (error) {
                    console.error('❌ Delete handler failed:', error.stack);
                }
            }
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;
            console.log(`👥 Group update in ${id}: ${action} ${participants.join(', ')}`);

            const welcomeManager = require('./lib/welcomeManager');
            if (action === 'add') {
                for (const participant of participants) {
                    await welcomeManager.handleWelcome(sock, id, participant);
                }
            } else if (action === 'remove') {
                for (const participant of participants) {
                    await welcomeManager.handleGoodbye(sock, id, participant);
                }
            }
        } catch (error) {
            console.error('Error handling group-participants update:', error);
        }
    });

    sock.ev.on('call', async (calls) => {
        if (callSettings.enabled) {
            for (const call of calls) {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, { text: '❌ Calls are auto-rejected! Message me instead. ☘️Ⓜ️' });
            }
        }
    });
}

module.exports = { startBot, statusViewer, messageSaver };