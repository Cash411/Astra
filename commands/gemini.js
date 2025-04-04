const { getPrefix } = require('./prefixHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const GEMINI_CONFIG = path.join(CONFIG_DIR, 'gemini.json');

// Create config directory if needed
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

module.exports = async (sock, sender, text, msg) => {
    try {
        const prefix = await getPrefix();
        const args = text.split(' ').slice(1);
        const command = args[0]?.toLowerCase();

        // 🔑 Key Setup Handler
        if (command === 'setup') {
            const apiKey = args[1];
            if (!apiKey) {
                return await sock.sendMessage(sender, {
                    text: `\`\`\`🔧 Gemini Setup\n\n1. Get API Key: https://aistudio.google.com/app/apikey\n2. Run: ${prefix}gemini setup <your_key>\`\`\` ☘️Ⓜ️`
                });
            }

            // Test the key immediately
            try {
                await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                    { contents: [{ parts: [{ text: "test" }] }] },
                    { timeout: 5000 }
                );
            } catch (err) {
                return await sock.sendMessage(sender, {
                    text: '```❌ Invalid API Key! Please verify your key.``` ☘️Ⓜ️'
                });
            }

            fs.writeFileSync(GEMINI_CONFIG, JSON.stringify({ apiKey }, null, 2));
            return await sock.sendMessage(sender, {
                text: '```✅ Gemini API key validated and saved!``` ☘️Ⓜ️'
            });
        }

        // Check configuration
        if (!fs.existsSync(GEMINI_CONFIG)) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Gemini Not Configured\n\nRun: ${prefix}gemini setup <your_key>\nGet key: https://aistudio.google.com/app/apikey\`\`\` ☘️Ⓜ️`
            });
        }

        const { apiKey } = JSON.parse(fs.readFileSync(GEMINI_CONFIG));
        const prompt = args.join(' ').trim();

        if (!prompt) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}gemini <question>\nExample: ${prefix}gemini Explain quantum physics\`\`\` ☘️Ⓜ️`
            });
        }

        // Show typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        // 🌐 Latest Working API Endpoint (April 2025)
        const { data } = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topP: 1,
                    topK: 40
                }
            },
            { 
                timeout: 15000,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const response = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!response) throw new Error("Empty response from Gemini");

        await sock.sendMessage(sender, {
            text: `\`\`\`🤖 ${response}\n\n(via Gemini 1.5 Pro)\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Gemini error:', error);
        let errorMsg = '```❌ Gemini Error\n\n';

        if (error.response?.data?.error) {
            // Google's detailed error message
            errorMsg += error.response.data.error.message || 'API Error';
        } else if (error.code === 'ECONNABORTED') {
            errorMsg += 'Request timeout (15s)';
        } else {
            errorMsg += 'Service unavailable. Try:\n1. Check https://status.cloud.google.com/\n2. Verify billing is enabled\n3. Try a new API key';
        }

        await sock.sendMessage(sender, {
            text: errorMsg + '``` ☘️Ⓜ️'
        });
    }
};