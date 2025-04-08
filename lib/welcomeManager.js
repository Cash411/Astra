// lib/welcomeManager.js
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fetch = require('node-fetch').default; // Explicitly import default

// Path to store the welcome/goodbye settings
const configPath = path.join(__dirname, '../config/welcomeSettings.json');

// Ensure config directory exists
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// Function to load current configuration
const loadConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return {
            welcome: {
                enabled: false,
                message: '```👋 Welcome to @group-name, @user! We\'re glad to have you here. ☘️Ⓜ️```',
                useUserPfp: false,
                useGroupPfp: false
            },
            goodbye: {
                enabled: false,
                message: '```👋 Goodbye, @user! We\'ll miss you. ☘️Ⓜ️```',
                useUserPfp: false,
                useGroupPfp: false
            },
            groups: {}
        };
    } catch (error) {
        console.error('Error loading welcome/goodbye config:', error);
        return {
            welcome: {
                enabled: false,
                message: '```👋 Welcome to @group-name, @user! We\'re glad to have you here. ☘️Ⓜ️```',
                useUserPfp: false,
                useGroupPfp: false
            },
            goodbye: {
                enabled: false,
                message: '```👋 Goodbye, @user! We\'ll miss you. ☘️Ⓜ️```',
                useUserPfp: false,
                useGroupPfp: false
            },
            groups: {}
        };
    }
};

// Function to save configuration
const saveConfig = (config) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving welcome/goodbye config:', error);
    }
};

// Get group-specific settings, fallback to global
const getGroupSettings = (groupId) => {
    const config = loadConfig();

    if (!config.groups[groupId]) {
        config.groups[groupId] = {
            welcome: { ...config.welcome },
            goodbye: { ...config.goodbye }
        };
        saveConfig(config);
    }

    return config.groups[groupId];
};

// Format message with placeholders
const formatMessage = (message, replacements) => {
    let formatted = message;
    for (const key in replacements) {
        formatted = formatted.replace(new RegExp(`@${key}`, 'gi'), replacements[key]);
    }
    return formatted;
};

// Function to download profile picture
const downloadPfp = async (sock, jid) => {
    try {
        const pfpUrl = await sock.profilePictureUrl(jid, 'image');
        console.log(`[WelcomeManager] PFP URL for ${jid}:`, pfpUrl); // Debug log
        if (pfpUrl) {
            const response = await fetch(pfpUrl);
            if (response.ok) {
                const buffer = await response.buffer();
                console.log(`[WelcomeManager] PFP downloaded successfully for ${jid}`); // Debug log
                return buffer;
            } else {
                console.error(`[WelcomeManager] Error fetching profile picture for ${jid} (HTTP ${response.status}):`, response.statusText);
                return null;
            }
        }
        console.log(`[WelcomeManager] No PFP URL found for ${jid}`); // Debug log
        return null;
    } catch (error) {
        console.error(`[WelcomeManager] Error fetching profile picture for ${jid}:`, error);
        return null;
    }
};

const welcomeManager = {
    setWelcome: (groupId, enabled, customMessage = null, useUserPfp = null, useGroupPfp = null) => {
        const config = loadConfig();
        if (!config.groups[groupId]) {
            config.groups[groupId] = {
                welcome: { ...config.welcome },
                goodbye: { ...config.goodbye }
            };
        }
        config.groups[groupId].welcome.enabled = enabled;
        if (customMessage !== null) {
            config.groups[groupId].welcome.message = customMessage;
        }
        if (useUserPfp !== null) {
            config.groups[groupId].welcome.useUserPfp = useUserPfp;
        }
        if (useGroupPfp !== null) {
            config.groups[groupId].welcome.useGroupPfp = useGroupPfp;
        }
        saveConfig(config);
        return config.groups[groupId].welcome;
    },

    setGoodbye: (groupId, enabled, customMessage = null, useUserPfp = null, useGroupPfp = null) => {
        const config = loadConfig();
        if (!config.groups[groupId]) {
            config.groups[groupId] = {
                welcome: { ...config.welcome },
                goodbye: { ...config.goodbye }
            };
        }
        config.groups[groupId].goodbye.enabled = enabled;
        if (customMessage !== null) {
            config.groups[groupId].goodbye.message = customMessage;
        }
        if (useUserPfp !== null) {
            config.groups[groupId].goodbye.useUserPfp = useUserPfp;
        }
        if (useGroupPfp !== null) {
            config.groups[groupId].goodbye.useGroupPfp = useGroupPfp;
        }
        saveConfig(config);
        return config.groups[groupId].goodbye;
    },

    getWelcome: (groupId) => {
        return getGroupSettings(groupId).welcome;
    },

    getGoodbye: (groupId) => {
        return getGroupSettings(groupId).goodbye;
    },

    handleWelcome: async (sock, groupId, user) => {
        try {
            const settings = getGroupSettings(groupId);
            if (!settings.welcome.enabled) return false;

            const groupMetadata = await sock.groupMetadata(groupId);
            const groupName = groupMetadata.subject || 'this group';

            let userName = user;
            try {
                const userInfo = await sock.fetchStatus(user);
                userName = userInfo?.status || `@${user.split('@')[0]}`;
            } catch (err) {
                userName = `@${user.split('@')[0]}`;
            }

            const replacements = {
                user: `@${user.split('@')[0]}`, // Mentionable user tag
                'user-display-name': userName, // User's display name/status
                'group-name': groupName
            };
            const message = formatMessage(settings.welcome.message, replacements);

            try { // Added try...catch for PFP handling
                const mediaOptions = {};
                let sentWithPfp = false;
                if (settings.welcome.useUserPfp) {
                    const pfp = await downloadPfp(sock, user);
                    if (pfp) {
                        mediaOptions.image = pfp;
                        mediaOptions.caption = message;
                        mediaOptions.mentions = [user];
                        await sock.sendMessage(groupId, mediaOptions);
                        sentWithPfp = true;
                    }
                }
                if (!sentWithPfp && settings.welcome.useGroupPfp) {
                    const groupPfp = await downloadPfp(sock, groupId);
                    if (groupPfp) {
                        mediaOptions.image = groupPfp;
                        mediaOptions.caption = message;
                        mediaOptions.mentions = [user];
                        await sock.sendMessage(groupId, mediaOptions);
                        sentWithPfp = true;
                    }
                }
                if (!sentWithPfp) {
                    await sock.sendMessage(groupId, { text: message, mentions: [user] });
                }
            } catch (pfpError) {
                console.error('[WelcomeManager] Error sending welcome message with profile picture:', pfpError);
                // Fallback to sending text-only message if PFP fails
                await sock.sendMessage(groupId, { text: message, mentions: [user] });
            }

            return true;
        } catch (error) {
            console.error('[WelcomeManager] Error handling welcome:', error);
            return false;
        }
    },

    handleGoodbye: async (sock, groupId, user) => {
        try {
            const settings = getGroupSettings(groupId);
            if (!settings.goodbye.enabled) return false;

            const groupMetadata = await sock.groupMetadata(groupId);
            const groupName = groupMetadata.subject || 'this group';

            const userName = `@${user.split('@')[0]}`;

            const replacements = {
                user: `@${user.split('@')[0]}`, // Mentionable user tag
                'user-display-name': userName, // User's display name (for goodbye, might not be available)
                'group-name': groupName
            };
            const message = formatMessage(settings.goodbye.message, replacements);

            try { // Added try...catch for PFP handling
                const mediaOptions = {};
                let sentWithPfp = false;
                if (settings.goodbye.useUserPfp) {
                    const pfp = await downloadPfp(sock, user);
                    if (pfp) {
                        mediaOptions.image = pfp;
                        mediaOptions.caption = message;
                        mediaOptions.mentions = [user];
                        await sock.sendMessage(groupId, mediaOptions);
                        sentWithPfp = true;
                    }
                }
                if (!sentWithPfp && settings.goodbye.useGroupPfp) {
                    const groupPfp = await downloadPfp(sock, groupId);
                    if (groupPfp) {
                        mediaOptions.image = groupPfp;
                        mediaOptions.caption = message;
                        mediaOptions.mentions = [user];
                        await sock.sendMessage(groupId, mediaOptions);
                        sentWithPfp = true;
                    }
                }
                if (!sentWithPfp) {
                    await sock.sendMessage(groupId, { text: message, mentions: [user] });
                }
            } catch (pfpError) {
                console.error('[WelcomeManager] Error sending goodbye message with profile picture:', pfpError);
                // Fallback to sending text-only message if PFP fails
                await sock.sendMessage(groupId, { text: message, mentions: [user] });
            }

            return true;
        } catch (error) {
            console.error('[WelcomeManager] Error handling goodbye:', error);
            return false;
        }
    }
};

module.exports = welcomeManager;