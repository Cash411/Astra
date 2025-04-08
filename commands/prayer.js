const fsPromises = require('node:fs/promises');
const path = require('path');

const PRAYER_DATABASE_FILE = path.join(__dirname, '../database/prayers.json');
// ---------------------

async function loadPrayersFromDatabase() {
    try {
        const data = await fsPromises.readFile(PRAYER_DATABASE_FILE, 'utf-8');
        const prayers = JSON.parse(data);
        if (Array.isArray(prayers) && prayers.length > 0) {
            return prayers;
        }
        console.error('Prayer database is empty or invalid.');
        return [];
    } catch (error) {
        console.error('Error loading prayers from database:', error.message);
        return [];
    }
}

async function getRandomPrayer() {
    const prayers = await loadPrayersFromDatabase();
    if (prayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * prayers.length);
        return prayers[randomIndex];
    }
    return null;
}

module.exports = async (sock, sender, text, msg) => {
    if (text.trim() === '.prayer') {
        try {
            console.log('Prayer command triggered (loading from database)');
            const prayer = await getRandomPrayer();

            if (prayer && prayer.text) {
                const message = `📖 *Daily Prayer:* 📖\n\n\`\`\`\n${prayer.text}\`\`\`\n\n${prayer.reference ? `📚 *Reference:* ${prayer.reference}\n` : ''}🤲`;
                await sock.sendMessage(sender, { text: message }, { quoted: msg });
            } else {
                await sock.sendMessage(sender, { text: '❌ No prayers found in the database. ☘️Ⓜ️' }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error in prayer command (database):', error);
            await sock.sendMessage(sender, { text: '❌ Something went wrong while fetching the prayer from the database. Please try again later. ☘️' }, { quoted: msg });
        }
    }
};