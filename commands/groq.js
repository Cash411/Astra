const { getPrefix } = require('./prefixHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const GROQ_CONFIG = path.join(CONFIG_DIR, 'groq.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

async function testGroqKey(apiKey) {
    try {
        // Test 1: Models endpoint
        const models = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 5000
        });

        // Test 2: Minimal completion
        const completion = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "mixtral-8x7b-32768",
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 1
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        return {
            valid: true,
            models: models.data.data.map(m => m.id),
            testResponse: completion.data
        };
    } catch (error) {
        return {
            valid: false,
            error: {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            }
        };
    }
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
                    text: `\`\`\`🔧 Groq Setup\n\n1. Visit: https://console.groq.com/keys\n2. Copy new key\n3. Run: ${prefix}groq setup <your_key>\`\`\` ☘️Ⓜ️`
                });
            }

            // Trim and validate key format
            const cleanKey = apiKey.trim();
            if (!cleanKey.match(/^gsk_[a-zA-Z0-9]{52}$/)) {
                return await sock.sendMessage(sender, {
                    text: '```❌ Invalid Format!\n• Must be 56 chars: gsk_ + 52 chars\n• No spaces or special chars\n• Get new key: https://console.groq.com/keys``` ☘️Ⓜ️'
                });
            }

            // Advanced key testing
            const { valid, models, error } = await testGroqKey(cleanKey);
            if (!valid) {
                let errorMsg = '```❌ Key Validation Failed!\n\n';
                
                if (error.status === 401) {
                    errorMsg += 'Key rejected by Groq\n• Confirm key is active\n• Check region restrictions';
                } else if (error.status === 429) {
                    errorMsg += 'Rate limited\n• Wait 1 minute\n• Check quota';
                } else {
                    errorMsg += `Technical Error:\n${error.message}\n\nTry:\n1. New key\n2. Different network\n3. Check status.groq.com`;
                }

                return await sock.sendMessage(sender, {
                    text: errorMsg + '``` ☘️Ⓜ️'
                });
            }

            // Save valid key
            fs.writeFileSync(GROQ_CONFIG, JSON.stringify({ 
                apiKey: cleanKey,
                lastTested: new Date().toISOString(),
                availableModels: models
            }, null, 2));

            return await sock.sendMessage(sender, {
                text: `\`\`\`✅ Key Activated!\n\nAvailable Models:\n${models.join('\n')}\`\`\` ☘️Ⓜ️`
            });
        }

        // Check if configured
        if (!fs.existsSync(GROQ_CONFIG)) {
            return await sock.sendMessage(sender, {
                text: `\`\`\❌ Not Configured\n\nRun: ${prefix}groq setup <your_key>\nGet key: https://console.groq.com/keys\`\`\` ☘️Ⓜ️`
            });
        }

        const { apiKey, availableModels } = JSON.parse(fs.readFileSync(GROQ_CONFIG));
        const prompt = args.join(' ').trim();

        if (!prompt) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}groq <question>\nExample: ${prefix}groq Explain AI in 5 words\`\`\` ☘️Ⓜ️`
            });
        }

        // Show typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        // 🌐 Groq API Request
        const { data } = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: availableModels.includes("llama3-70b-8192") 
                    ? "llama3-70b-8192" 
                    : "mixtral-8x7b-32768",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1024
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 20000 // 20 second timeout
            }
        );

        await sock.sendMessage(sender, {
            text: `\`\`\`⚡ ${data.choices[0].message.content}\n\n(via Groq ${data.model})\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Groq error:', error);
        let errorMsg = '```❌ Critical Error\n\n';

        if (error.response) {
            errorMsg += `Status: ${error.response.status}\n`;
            if (error.response.data?.error) {
                errorMsg += `Details: ${JSON.stringify(error.response.data.error, null, 2)}`;
            }
        } else {
            errorMsg += `Technical Issue:\n${error.message}\n\n`;
            errorMsg += 'Troubleshoot:\n1. .groq setup <new_key>\n2. Check network\n3. Wait 5 mins';
        }

        await sock.sendMessage(sender, {
            text: errorMsg + '``` ☘️Ⓜ️'
        });
    }
};