const { getPrefix } = require('./prefixHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config file path
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'deepseek.json');

// Ensure config directory exists
if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

module.exports = async (sock, sender, text, msg) => {
    try {
        const prefix = await getPrefix();
        const args = text.split(' ').slice(1);
        const command = args[0]?.toLowerCase();

        // Handle API key setup
        if (command === 'setup') {
            const apiKey = args[1];
            if (!apiKey) {
                return await sock.sendMessage(sender, {
                    text: `\`\`\`🔑 DeepSeek Setup\n\nUsage: ${prefix}deepseek setup <your_api_key>\n\nGet your key at: https://platform.deepseek.com\`\`\` ☘️Ⓜ️`
                });
            }

            fs.writeFileSync(CONFIG_PATH, JSON.stringify({ apiKey }, null, 2));
            return await sock.sendMessage(sender, {
                text: '```✅ DeepSeek API key saved securely!``` ☘️Ⓜ️'
            });
        }

        // Check if configured
        if (!fs.existsSync(CONFIG_PATH)) {
            return await sock.sendMessage(sender, {
                text: `\`\`\❌ DeepSeek not configured\n\n1. Get API key: https://platform.deepseek.com\n2. Run: ${prefix}deepseek setup <your_key>\`\`\` ☘️Ⓜ️`
            });
        }

        const { apiKey } = JSON.parse(fs.readFileSync(CONFIG_PATH));
        const prompt = args.join(' ').trim();

        if (!prompt) {
            return await sock.sendMessage(sender, {
                text: `\`\`\`❌ Usage: ${prefix}deepseek <question>\nExample: ${prefix}deepseek Explain quantum physics\`\`\` ☘️Ⓜ️`
            });
        }

        // API Request
        const { data } = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 10000
            }
        );

        await sock.sendMessage(sender, {
            text: `\`\`\`🤖 ${data.choices[0].message.content}\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('DeepSeek error:', error);
        let errorMessage = '```❌ DeepSeek Error\n\n';

        if (error.response?.status === 401) {
            errorMessage += 'Invalid API Key!\nRun: .deepseek setup <new_key>';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += 'Request timeout. Try again later.';
        } else {
            errorMessage += 'Service unavailable. Try again later.';
        }

        await sock.sendMessage(sender, {
            text: errorMessage + '``` ☘️Ⓜ️'
        });
    }
};