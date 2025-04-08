const { jidDecode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

class StatusAutoViewer {
    constructor(configPath) {
        this.stateFile = path.join(configPath, 'statusAutoViewerState.json');
        this.tempDir = path.join(configPath, 'temp');
        this.selfJid = null;
        this.state = {
            enabled: false,
            downloadMedia: false,
            reactionEmoji: null,
            lastRun: null,
            viewedStatuses: []
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
                    ...loadedState,
                    viewedStatuses: Array.isArray(loadedState.viewedStatuses) ? loadedState.viewedStatuses : []
                };
                console.log(`🔧 Loaded state: ${JSON.stringify(this.state)}`);
            } else {
                console.log(`🔧 No state file found at ${this.stateFile}—using defaults`);
            }
        } catch (error) {
            console.error(`❌ Error loading state: ${error.message}`);
            this.state.viewedStatuses = [];
        }
    }

    _saveState() {
        try {
            console.log(`🔧 Saving state: ${JSON.stringify(this.state)}`);
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

    toggle(enabled) {
        this.state.enabled = enabled;
        this._saveState();
        console.log(`🔧 Auto-viewer toggled: ${enabled ? 'ON' : 'OFF'}`);
    }

    setDownload(download) {
        this.state.downloadMedia = download;
        this._saveState();
        console.log(`📥 Media download set to: ${download ? 'ENABLED' : 'DISABLED'}`);
    }

    setReactionEmoji(emoji) {
        this.state.reactionEmoji = emoji;
        this._saveState();
        console.log(`😊 Reaction emoji set to: ${emoji || 'NONE'}`);
    }

    getStatus() {
        const status = this.state.enabled ? 'ON' : 'OFF';
        const download = this.state.downloadMedia ? 'ENABLED' : 'DISABLED';
        const emoji = this.state.reactionEmoji || 'NONE';
        return '```📊 Status Viewer```\n' +
               '```🟢 Active: ' + status + '```\n' +
               '```📥 Download: ' + download + '```\n' +
               '```😊 Reaction: ' + emoji + '```';
    }

    async handleStatusUpdate(msg) {
        console.log(`📩 Received message:`, JSON.stringify(msg, null, 2));

        if (!this.state.enabled || !this.selfJid || !this.sock) {
            console.log(`⚠️ Auto-viewer not initialized or disabled - enabled: ${this.state.enabled}, selfJid: ${this.selfJid}, sock: ${!!this.sock}`);
            return;
        }

        const sender = msg.key.remoteJid;
        if (sender !== 'status@broadcast') return;

        const contact = msg.key.participant || msg.key.remoteJid;
        const decoded = jidDecode(contact);

        if (!contact || !decoded || !decoded.user) {
            console.error(`⚠️ Invalid or undecodable JID: ${contact}`);
            return;
        }

        console.log(`🔍 Received JID: ${contact}`);

        if (contact.split(':')[0] === this.selfJid.split('@')[0]) {
            console.log(`ℹ️ Skipping self status from ${contact}`);
            return;
        }

        const message = msg.message;
        if (!message || (message.protocolMessage && message.protocolMessage.type === 'REVOKE') || message.reactionMessage) {
            console.log(`ℹ️ Skipping revoke, reaction, or empty status from ${contact}`);
            return;
        }

        const statusId = `${contact}:${msg.messageTimestamp}`;
        if (this.state.viewedStatuses.includes(statusId)) {
            console.log(`ℹ️ Already viewed status: ${statusId}`);
            return;
        }

        try {
            await this.sock.chatModify(
                { markRead: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
                contact
            );
            console.log(`🔧 Marked status as read: ${msg.key.id}`);
            await this.sock.sendReadReceipt(contact, msg.key.participant, [msg.key.id]);
            console.log(`🔧 Sent read receipt to ${contact}`);
        } catch (e) {
            console.error(`❌ chatModify failed: ${e.message}`);
            await this.sock.readMessages([msg.key]);
            console.log(`🔧 Fallback to readMessages: ${msg.key.id}`);
        }

        try {
            await this.sock.sendPresenceUpdate('available', contact);
            console.log(`🔧 Sent presence update to ${contact}`);
        } catch (e) {
            console.error(`❌ Presence update failed: ${e.message}`);
        }

        if (this.state.reactionEmoji) {
            try {
                await this.sock.sendMessage(contact, {
                    reaction: { text: this.state.reactionEmoji, key: msg.key } // Updated to 'reaction'
                });
                console.log(`😊 Reacted with ${this.state.reactionEmoji} to ${contact}`);
            } catch (e) {
                console.error(`❌ Reaction failed: ${e.message}`);
                // Fallback: simulate reaction via chatModify if supported
                try {
                    await this.sock.chatModify(
                        { reaction: this.state.reactionEmoji, key: msg.key },
                        contact
                    );
                    console.log(`😊 Fallback reaction with ${this.state.reactionEmoji} to ${contact}`);
                } catch (fallbackError) {
                    console.error(`❌ Fallback reaction failed: ${fallbackError.message}`);
                }
            }
        }

        console.log(`👀 Viewed status from ${contact}`);
        this.state.viewedStatuses.push(statusId);

        if (this.state.downloadMedia && (message.imageMessage || message.videoMessage)) {
            try {
                const type = message.imageMessage ? 'image' : 'video';
                const mediaMsg = message.imageMessage || message.videoMessage;

                if (!mediaMsg) {
                    console.log(`⚠️ No media content found for ${contact}`);
                    return;
                }

                const stream = await downloadContentFromMessage(mediaMsg, type);
                const bufferArray = [];
                for await (const chunk of stream) {
                    bufferArray.push(chunk);
                }

                const buffer = Buffer.concat(bufferArray);
                const fileExt = type === 'image' ? 'jpg' : 'mp4';
                const tempFile = path.join(this.tempDir, `${statusId}.${fileExt}`);

                fs.writeFileSync(tempFile, buffer);
                console.log(`📥 Saved ${type} to temp: ${tempFile}`);

                console.log(`ℹ️ Attempting to send status to self JID: ${this.selfJid}`);
                if (!this.sock.user || !this.selfJid) {
                    console.log(`⚠️ Sock.user or selfJid lost, re-initializing`);
                    this.initialize(this.sock);
                    if (!this.sock.user) throw new Error('Sock re-init failed - no user data');
                }

                // Get contact name
                let contactName = contact.split('@')[0];
                try {
                    const contactInfo = await this.sock.fetchContact(contact);
                    contactName = contactInfo?.name || contactInfo?.notify || contact.split('@')[0];
                } catch (e) {
                    console.error(`⚠️ Failed to fetch contact name: ${e.message}`);
                }

                const caption = '```\n' +
                                '📸 From Status\n' +
                                `👤 ${contactName}${mediaMsg.caption ? '\n✏️ ' + mediaMsg.caption : ''}\n` +
                                '```';

                await this.sock.sendMessage(this.selfJid, {
                    [type]: buffer,
                    caption: caption,
                    mimetype: mediaMsg.mimetype
                });
                console.log(`📤 Forwarded ${type} status from ${contact} to ${this.selfJid}`);

                fs.unlinkSync(tempFile);
            } catch (dlError) {
                console.error(`❌ Download failed for ${contact}: ${dlError.message}`);
            }
        }

        if (this.state.viewedStatuses.length > 100) {
            this.state.viewedStatuses = this.state.viewedStatuses.slice(-50);
        }

        this.state.lastRun = new Date().toISOString();
        this._saveState();
    }

    // Helper to fetch contact info
    async fetchContact(jid) {
        const [result] = await this.sock.onWhatsApp(jid);
        return result || { name: null, notify: null };
    }
}

module.exports = StatusAutoViewer;