const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

class MessageSaver {
    constructor(configPath) {
        this.stateFile = path.join(configPath, 'messageSaverState.json');
        this.tempDir = path.join(configPath, 'temp');
        this.selfJid = null;
        this.state = {
            savedMessages: {}
        };
        this.sock = null;

        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        this._loadState();
    }

    _loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                console.log(`🔧 Loading state from ${this.stateFile}`);
                const loadedState = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                this.state = {
                    ...this.state,
                    savedMessages: loadedState.savedMessages || {}
                };
                console.log(`🔧 Loaded state: ${JSON.stringify(this.state)}`);
            } else {
                console.log(`🔧 No state file found at ${this.stateFile}—using defaults`);
            }
        } catch (error) {
            console.error(`❌ Error loading state: ${error.message}`);
            this.state.savedMessages = {};
        }
    }

    _saveState() {
        try {
            // Optionally mute this log to reduce buffer noise
            console.log(`🔧 Saving state`);
            fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
            console.log(`🔧 State saved to ${this.stateFile}`);
        } catch (error) {
            console.error(`❌ Error saving state: ${error.message}`);
        }
    }

    initialize(sock) {
        if (sock?.user?.id) {
            this.selfJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            this.sock = sock;
            console.log(`🔧 Self JID set to: ${this.selfJid}`);
        } else {
            console.error('⚠️ Could not determine self JID from sock.user:', sock?.user);
            this.selfJid = null;
        }
    }

    async saveMessage(msgId) {
        const saved = this.state.savedMessages[msgId];
        if (!saved) {
            console.log(`⚠️ No saved message found for ${msgId}`);
            return false;
        }

        console.log(`ℹ️ Attempting to send saved message ${msgId} to self JID: ${this.selfJid}`);
        if (!this.sock?.user?.id || !this.selfJid) {
            console.log(`⚠️ Sock.user or selfJid lost, re-initializing`);
            this.initialize(this.sock);
            if (!this.sock?.user?.id) throw new Error('Sock re-init failed - no user data');
        }

        const caption = '```\n' +
                        `👤 ${saved.contact}${saved.caption ? '\n✏️ ' + saved.caption : ''}\n` +
                        '```';

        try {
            switch (saved.type) {
                case 'text':
                    await this.sock.sendMessage(this.selfJid, { text: caption + '\n' + saved.content });
                    break;
                case 'image':
                    await this.sock.sendMessage(this.selfJid, {
                        image: saved.content,
                        caption: caption,
                        mimetype: 'image/jpeg'
                    });
                    break;
                case 'video':
                    await this.sock.sendMessage(this.selfJid, {
                        video: saved.content,
                        caption: caption,
                        mimetype: 'video/mp4'
                    });
                    break;
                case 'audio':
                    await this.sock.sendMessage(this.selfJid, {
                        audio: saved.content,
                        caption: caption,
                        mimetype: 'audio/mpeg'
                    });
                    break;
                case 'sticker':
                    await this.sock.sendMessage(this.selfJid, {
                        sticker: saved.content,
                        mimetype: 'image/webp' // Explicit WebP for stickers
                    });
                    break;
            }
            console.log(`📤 Saved message ${msgId} sent to ${this.selfJid}`);
            return true;
        } catch (error) {
            console.error(`❌ Error sending saved message ${msgId}:`, error.message);
            return false;
        }
    }

    async fetchContact(jid) {
        const [result] = await this.sock.onWhatsApp(jid);
        return result || { name: null, notify: null };
    }

    async streamToBuffer(stream) {
        const bufferArray = [];
        for await (const chunk of stream) {
            bufferArray.push(chunk);
        }
        return Buffer.concat(bufferArray);
    }
}

module.exports = MessageSaver;