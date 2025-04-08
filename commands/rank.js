const fs = require('fs').promises;
const path = require('path');
const { getPrefix } = require('./prefixHandler');

const ranksFile = path.join(__dirname, '../database/ranks.json');

// Updated rank list with emojis and progressive difficulty
const rankLevels = [
    { name: 'Newbie', emoji: '🌱', points: 0 },
    { name: 'Sprout', emoji: '🌿', points: 5 },
    { name: 'Chatter', emoji: '💬', points: 15 },
    { name: 'Talker', emoji: '🗣️', points: 30 },
    { name: 'Banter Buddy', emoji: '😄', points: 50 },
    { name: 'Groupie', emoji: '🎉', points: 80 },
    { name: 'Chat Star', emoji: '⭐', points: 120 },
    { name: 'Voice Vibe', emoji: '🎤', points: 180 },
    { name: 'Conversation King', emoji: '👑', points: 250 },
    { name: 'Discourse Duke', emoji: '🏰', points: 350 },
    { name: 'Chat Champion', emoji: '🏆', points: 500 },
    { name: 'Word Wizard', emoji: '✨', points: 750 },
    { name: 'Legendary Speaker', emoji: '🗿', points: 1000 },
    { name: 'Epic Orator', emoji: '⚡', points: 2000 },
    { name: 'Mythic Master', emoji: '🌌', points: 5000 }
];

// Load or initialize ranks data
async function loadRanks() {
    try {
        const data = await fs.readFile(ranksFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Initializing ranks file...');
        const initialData = { groups: {} };
        await fs.writeFile(ranksFile, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

// Save ranks data
async function saveRanks(data) {
    await fs.writeFile(ranksFile, JSON.stringify(data, null, 2));
}

// Get user's rank based on points
function getRank(points) {
    for (let i = rankLevels.length - 1; i >= 0; i--) {
        if (points >= rankLevels[i].points) {
            return { name: rankLevels[i].name, emoji: rankLevels[i].emoji, points: rankLevels[i].points };
        }
    }
    return rankLevels[0]; // Fallback to Newbie
}

// Get user's display name or number
async function getDisplayName(sock, userId) {
    try {
        const contact = await sock.getContactById(userId);
        return contact.notify || contact.pushname || userId.split('@')[0];
    } catch (error) {
        console.error(`Failed to fetch display name for ${userId}:`, error);
        return userId.split('@')[0]; // Fallback to number
    }
}

// Command handler
module.exports = async (sock, sender, text, msg) => {
    const prefix = await getPrefix();
    const args = text.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    const subcommand = args[0]?.toLowerCase();

    if (!msg.key.remoteJid.endsWith('@g.us')) {
        await sock.sendMessage(sender, { text: '```❌ This command only works in groups!``` ☘️Ⓜ️' });
        return;
    }

    const groupId = msg.key.remoteJid;
    let ranksData = await loadRanks();

    if (!ranksData.groups[groupId]) {
        ranksData.groups[groupId] = { enabled: false, members: {} };
    }

    const groupData = ranksData.groups[groupId];

    try {
        if (subcommand === 'on') {
            groupData.enabled = true;
            await saveRanks(ranksData);
            await sock.sendMessage(sender, { text: '```✅ Ranking system enabled for this group!``` ☘️Ⓜ️' });
        } 
        else if (subcommand === 'off') {
            groupData.enabled = false;
            await saveRanks(ranksData);
            await sock.sendMessage(sender, { text: '```✅ Ranking system disabled for this group!``` ☘️Ⓜ️' });
        } 
        else {
            // Show rank for self or mentioned user
            let target = sender;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }

            if (!groupData.enabled) {
                await sock.sendMessage(sender, { text: '```❌ Ranking is disabled in this group. Use .rank on to enable.``` ☘️Ⓜ️' });
                return;
            }

            const points = groupData.members[target]?.points || 0;
            const rank = getRank(points);
            const displayName = await getDisplayName(sock, target);

            await sock.sendMessage(sender, { 
                text: `\`\`\`
🌟 **Rank Card** 🌟
✨ **User**: ${displayName}
🏅 **Rank**: ${rank.emoji} ${rank.name}
📊 **Points**: ${points}
──────────────
Keep chatting to climb! 🚀
\`\`\` ☘️Ⓜ️`
            });
        }
    } catch (error) {
        console.error('Rank command error:', error);
        await sock.sendMessage(sender, { text: '```❌ Something went wrong! Try again later.``` ☘️Ⓜ️' });
    }
};

// Update points and notify on rank-up with mention
module.exports.updatePoints = async (groupId, userId, sock) => {
    let ranksData = await loadRanks();

    if (!ranksData.groups[groupId] || !ranksData.groups[groupId].enabled) {
        return; // Do nothing if ranking is off or group not initialized
    }

    if (!ranksData.groups[groupId].members[userId]) {
        ranksData.groups[groupId].members[userId] = { points: 0 };
    }

    const oldPoints = ranksData.groups[groupId].members[userId].points;
    ranksData.groups[groupId].members[userId].points += 1;
    const newPoints = ranksData.groups[groupId].members[userId].points;

    await saveRanks(ranksData);

    // Check for rank-up
    const oldRank = getRank(oldPoints);
    const newRank = getRank(newPoints);
    if (newRank.points > oldRank.points) {
        try {
            const displayName = await getDisplayName(sock, userId);
            await sock.sendMessage(groupId, {
                text: `\`\`\`
🎉 **Rank Up Alert** 🎉
🌟 @${displayName} has leveled up! 🌟
🏅 **New Rank**: ${newRank.emoji} ${newRank.name}
📊 **Points**: ${newPoints}
──────────────
Keep it up, champ! 💪
\`\`\` ☘️Ⓜ️`,
                mentions: [userId]
            });
            console.log(`Rank-up notification sent for ${userId}: ${newRank.name}`);
        } catch (error) {
            console.error('Rank-up notification failed:', error);
        }
    }
};