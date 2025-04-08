const { getPrefix } = require('./prefixHandler');
require('dotenv').config(); // Load environment variables
const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

/**
 * Fetch live scores from the API-Football API.
 * @returns {Promise<string>} - A formatted string of live scores or a message if no matches are live.
 */
async function fetchLiveScores() {
    try {
        const response = await axios.get(`${BASE_URL}/fixtures`, {
            params: {
                live: 'all'
            },
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        const matches = response.data.response;

        if (!matches || matches.length === 0) {
            return '⚽ No live matches currently.';
        }

        const formattedMatches = matches.map(match => {
            const homeTeam = match.teams.home.name;
            const awayTeam = match.teams.away.name;
            const homeScore = match.goals.home || 0;
            const awayScore = match.goals.away || 0;
            const status = match.fixture.status.short;

            const statusEmoji = getStatusEmoji(status);
            const statusDesc = getStatusDescription(status);

            // Get goal scorer names
            const events = match.events || [];
            const scorers = events
                .filter(event => event.type === 'Goal')
                .map(event => {
                    const minute = event.time.elapsed;
                    const extra = event.time.extra ? `+${event.time.extra}` : '';
                    return `${event.player.name} (${minute}${extra}′)`;
                });

            return [
                `┌───── 🏟️ *${homeTeam}* ${statusEmoji} *${awayTeam}* ─────┐`,
                `│   📊 *Score:* \`${homeScore} - ${awayScore}\``,
                `│   ⏱️ *Status:* _${statusDesc}_`,
                `│`,
                scorers.length
                    ? `│   👟 *Scorers:*\n${scorers.map(s => `│   ➤ ${s}`).join('\n')}`
                    : `│   👟 Scorers: _Not available yet_`,
                `└─────────────────────────────────────┘`
            ].join('\n');
        });

        const header = `🎯 *⚽ LIVE FOOTBALL SCORES ⚽* 🎯\n\`\`\`\n─── LIVE MATCHES ───\n\`\`\``;
        const footer = `\`\`\`\n────────── END ──────────\n\`\`\``;

        return `${header}\n${formattedMatches.join('\n\n')}\n${footer}`;
    } catch (error) {
        console.error(`❌ Error fetching live scores: ${error.message}`);
        throw new Error('Failed to fetch live scores.');
    }
}

/**
 * Get an emoji based on the match status.
 * @param {string} status - The match status (e.g., "1H", "HT", "FT").
 * @returns {string} - An emoji representing the status.
 */
function getStatusEmoji(status) {
    switch (status) {
        case '1H':
            return '⏳';
        case 'HT':
            return '🔄';
        case '2H':
            return '⚡';
        case 'ET':
            return '⏱️';
        case 'P':
            return '🎯';
        case 'FT':
            return '🏁';
        default:
            return '⚽';
    }
}

/**
 * Get a full description based on the match status.
 * @param {string} status
 * @returns {string}
 */
function getStatusDescription(status) {
    switch (status) {
        case '1H':
            return 'First Half';
        case 'HT':
            return 'Halftime';
        case '2H':
            return 'Second Half';
        case 'ET':
            return 'Extra Time';
        case 'P':
            return 'Penalties';
        case 'FT':
            return 'Full Time';
        default:
            return 'In Progress';
    }
}

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Livescore command triggered ☘️Ⓜ️');
        
        const prefix = await getPrefix();
        console.log(`Using prefix: ${prefix}`);
        
        await sock.presenceSubscribe(sender);
        await sock.sendPresenceUpdate('composing', sender);
        
        const loadingMsg = await sock.sendMessage(sender, {
            text: '```⏳ Fetching live scores... Please wait``` ☘️Ⓜ️'
        });
        
        const liveScores = await fetchLiveScores();
        
        const styledMessage = `${liveScores}\n\n_Updated: ${new Date().toLocaleString()}_\n\nType *${prefix}livescore* anytime to refresh ⏱️`;
        
        await sock.sendMessage(sender, {
            text: styledMessage
        });

        // Optional: Delete loading message if needed
        // await sock.sendMessage(sender, { delete: loadingMsg.key });

    } catch (error) {
        console.error('❌ Livescore error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Failed to fetch live scores!\nCheck your API key or try again later.``` ☘️Ⓜ️'
        });
    }
};
