const { getPrefix } = require('./prefixHandler');
const fs = require('fs');
const path = require('path');

// File to store notes (JSON format)
const NOTES_FILE = path.join(__dirname, '../database/userNotes.json');

// Load existing notes
let userNotes = {};
try {
    userNotes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
} catch (err) {
    console.log('Creating new notes file... ☘️Ⓜ️');
    fs.writeFileSync(NOTES_FILE, '{}');
}

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Notes command triggered ☘️Ⓜ️');
        const prefix = await getPrefix();

        // Check if replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isReply = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

        const args = text.split(' ').slice(1);
        const action = args[0]?.toLowerCase();
        const noteName = args[1];
        let noteContent = args.slice(2).join(' ');

        // Handle reply-to-save case
        if (isReply && action === 'save' && noteName) {
            noteContent = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        }

        if (!action || !['save', 'get', 'list', 'delete'].includes(action)) {
            await sock.sendMessage(sender, {
                text: `\`\`\`📝 Notes Usage:\n\n${prefix}notes save <name> <content>\n${prefix}notes save <name> (as reply)\n${prefix}notes get <name>\n${prefix}notes list\n${prefix}notes delete <name>\`\`\` ☘️Ⓜ️`
            });
            return;
        }

        // Initialize user's note storage if needed
        if (!userNotes[sender]) {
            userNotes[sender] = {};
        }

        switch (action) {
            case 'save':
                if (!noteName) {
                    await sock.sendMessage(sender, {
                        text: '```❌ Please provide a note name!``` ☘️Ⓜ️'
                    });
                    return;
                }
                if (!noteContent && !isReply) {
                    await sock.sendMessage(sender, {
                        text: '```❌ Please provide note content or reply to a message!``` ☘️Ⓜ️'
                    });
                    return;
                }
                userNotes[sender][noteName] = noteContent;
                await saveNotes();
                await sock.sendMessage(sender, {
                    text: `\`\`\`✅ Note saved!\n\nName: ${noteName}\nContent: ${noteContent}\`\`\` ☘️Ⓜ️`,
                    mentions: isReply ? [msg.key.participant || msg.key.remoteJid] : []
                });
                break;

            case 'get':
                if (!noteName) {
                    await sock.sendMessage(sender, {
                        text: '```❌ Please specify a note name!``` ☘️Ⓜ️'
                    });
                    return;
                }
                if (!userNotes[sender]?.[noteName]) {
                    await sock.sendMessage(sender, {
                        text: '```❌ Note not found!``` ☘️Ⓜ️'
                    });
                    return;
                }
                await sock.sendMessage(sender, {
                    text: `\`\`\`📄 Note: ${noteName}\n\n${userNotes[sender][noteName]}\`\`\` ☘️Ⓜ️`
                });
                break;

            case 'list':
                const notesList = Object.keys(userNotes[sender] || {}).join('\n') || 'No notes saved';
                await sock.sendMessage(sender, {
                    text: `\`\`\`📋 Your Notes:\n\n${notesList}\`\`\` ☘️Ⓜ️`
                });
                break;

            case 'delete':
                if (!noteName) {
                    await sock.sendMessage(sender, {
                        text: '```❌ Please specify a note name!``` ☘️Ⓜ️'
                    });
                    return;
                }
                if (!userNotes[sender]?.[noteName]) {
                    await sock.sendMessage(sender, {
                        text: '```❌ Note not found!``` ☘️Ⓜ️'
                    });
                    return;
                }
                delete userNotes[sender][noteName];
                await saveNotes();
                await sock.sendMessage(sender, {
                    text: '```🗑️ Note deleted successfully!``` ☘️Ⓜ️'
                });
                break;
        }

    } catch (error) {
        console.error('Notes error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Notes service error! Try again.``` ☘️Ⓜ️'
        });
    }
};

async function saveNotes() {
    return new Promise((resolve, reject) => {
        fs.writeFile(NOTES_FILE, JSON.stringify(userNotes, null, 2), (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}