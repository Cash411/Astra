// lib/onlineManager.js
const fs = require('fs');
const path = require('path');

// Path to store the online status configuration
const configPath = path.join(__dirname, '../database/onlineStatus.json');

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
        return { alwaysOnline: false };
    } catch (error) {
        console.error('Error loading online config:', error);
        return { alwaysOnline: false };
    }
};

// Function to save configuration
const saveConfig = (config) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving online config:', error);
    }
};

// Main online manager functions
const onlineManager = {
    // Get current status
    getStatus: () => {
        return loadConfig().alwaysOnline;
    },
    
    // Enable always online
    enableOnline: async (sock, sender) => {
        const config = loadConfig();
        config.alwaysOnline = true;
        saveConfig(config);
        
        // Clear existing interval if any
        if (global.onlineInterval) {
            clearInterval(global.onlineInterval);
        }
        
        // Set up interval
        global.onlineInterval = setInterval(async () => {
            try {
                await sock.sendPresenceUpdate('available');
            } catch (err) {
                console.error('Failed to update presence:', err);
            }
        }, 30000);
        
        // Set initial presence
        await sock.sendPresenceUpdate('available');
        
        return true;
    },
    
    // Disable always online
    disableOnline: async (sock) => {
        const config = loadConfig();
        config.alwaysOnline = false;
        saveConfig(config);
        
        // Clear the interval
        if (global.onlineInterval) {
            clearInterval(global.onlineInterval);
            global.onlineInterval = null;
        }
        
        return true;
    },
    
    // Initialize online status on bot start
    initializeOnlineStatus: async (sock) => {
        try {
            const config = loadConfig();
            if (config.alwaysOnline) {
                console.log('🟢 Initializing always online mode...');
                global.onlineInterval = setInterval(async () => {
                    try {
                        await sock.sendPresenceUpdate('available');
                    } catch (err) {
                        console.error('Failed to update presence:', err);
                    }
                }, 30000);
                
                // Set initial presence
                await sock.sendPresenceUpdate('available');
            }
        } catch (error) {
            console.error('Error initializing online status:', error);
        }
    }
};

module.exports = onlineManager;