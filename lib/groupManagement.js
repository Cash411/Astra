const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');

const warnedUsersFile = path.join(__dirname, '../database/warnedUsers.json');

async function loadWarnedUsers() {
    try {
        const data = await fs.readFile(warnedUsersFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error('Error loading warned users:', error);
        return {};
    }
}

async function saveWarnedUsers(users) {
    try {
        await fs.writeFile(warnedUsersFile, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving warned users:', error);
    }
}

// Utility to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function checkAndManageInactive(sock, groupId, inactiveDaysThreshold = 3) {
    let warnedUsers = await loadWarnedUsers();

    // Ensure group-specific structure
    if (!warnedUsers[groupId]) {
        warnedUsers[groupId] = {};
    }

    try {
        console.log(`⚙️ Checking for inactive members in group: ${groupId} (Threshold: ${inactiveDaysThreshold} days)`);

        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants.map(p => p.id);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const inactiveMembers = [];
        const usersToKick = [];
        const alreadyWarned = [];
        const now = moment();
        const kickGracePeriodDays = 7;

        let messages;
        try {
            messages = await sock.groupFetchAllParticipating(groupId);
            console.log('Raw messages data:', messages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            messages = {};
        }

        const lastMessages = {};

        if (messages && typeof messages === 'object') {
            for (const key in messages) {
                const messageData = messages[key];
                if (Array.isArray(messageData)) {
                    messageData.forEach(msg => {
                        const sender = msg.key.participant || msg.key.remoteJid;
                        if (!lastMessages[sender] || msg.messageTimestamp > lastMessages[sender].timestamp) {
                            lastMessages[sender] = { timestamp: msg.messageTimestamp * 1000, key: msg.key };
                        }
                    });
                } else {
                    console.log(`Skipping key ${key}: not an array`, messageData);
                }
            }
        } else {
            console.log('No valid message data found.');
        }

        console.log('Last messages:', lastMessages);

        for (const participantId of participants) {
            if (participantId === botId) continue;

            const lastMessageInfo = lastMessages[participantId];
            if (!lastMessageInfo) {
                inactiveMembers.push(participantId);
                console.log(`${participantId} has no recorded messages.`);
                continue;
            }

            const lastActive = moment(lastMessageInfo.timestamp);
            const daysSinceLastActive = now.diff(lastActive, 'days');

            console.log(`${participantId} last active: ${lastActive.format('YYYY-MM-DD HH:mm:ss')} (${daysSinceLastActive} days ago)`);

            if (daysSinceLastActive >= inactiveDaysThreshold) {
                inactiveMembers.push(participantId);
            }
        }

        console.log(`⚠️ Found ${inactiveMembers.length} potentially inactive members:`, inactiveMembers);

        // Separate users to warn, kick, or note as already warned (group-specific)
        const usersToWarn = [];
        for (const inactiveUser of inactiveMembers) {
            if (!warnedUsers[groupId][inactiveUser]) {
                usersToWarn.push(inactiveUser);
                warnedUsers[groupId][inactiveUser] = { warnedAt: Date.now() };
            } else {
                const daysSinceWarning = moment().diff(moment(warnedUsers[groupId][inactiveUser].warnedAt), 'days');
                if (daysSinceWarning >= kickGracePeriodDays) {
                    usersToKick.push(inactiveUser);
                } else {
                    alreadyWarned.push({ user: inactiveUser, daysLeft: kickGracePeriodDays - daysSinceWarning });
                }
            }
        }

        // Send warning message with design
        if (usersToWarn.length > 0) {
            const batchSize = 20;
            for (let i = 0; i < usersToWarn.length; i += batchSize) {
                const batch = usersToWarn.slice(i, i + batchSize);
                const mentions = batch;
                const taggedUsers = batch.map(u => `@${u.split('@')[0]}`).join(', ');
                const warningMessage = `\`\`\`
⚠️ **Inactivity Alert** ⚠️
👤 Users: ${taggedUsers}
⏳ Inactive For: ${inactiveDaysThreshold} days
📢 Action: Be active within ${kickGracePeriodDays} days or face removal!
───────────────
\`\`\` ☘️Ⓜ️`;
                try {
                    await sock.sendMessage(groupId, {
                        text: warningMessage,
                        mentions: mentions
                    });
                    console.log(`📢 Warned ${batch.length} users in batch:`, batch);
                    await delay(1000);
                } catch (error) {
                    console.error('Failed to send warning message:', error);
                    await sock.sendMessage(groupId, { text: `\`\`\`❌ Failed to send warning message.\`\`\` ☘️Ⓜ️` });
                }
            }
            await saveWarnedUsers(warnedUsers);
        }

        // Send already warned message
        if (alreadyWarned.length > 0) {
            const batchSize = 20;
            for (let i = 0; i < alreadyWarned.length; i += batchSize) {
                const batch = alreadyWarned.slice(i, i + batchSize);
                const mentions = batch.map(item => item.user);
                const warnedList = batch.map(item => `👤 @${item.user.split('@')[0]} - ${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'} left`).join('\n');
                const alreadyWarnedMessage = `\`\`\`
⏳ **Previously Warned** ⏳
${warnedList}
───────────────
\`\`\` ☘️Ⓜ️`;
                try {
                    await sock.sendMessage(groupId, {
                        text: alreadyWarnedMessage,
                        mentions: mentions
                    });
                    console.log(`📢 Notified ${batch.length} previously warned users:`, batch);
                    await delay(1000);
                } catch (error) {
                    console.error('Failed to send already warned message:', error);
                    await sock.sendMessage(groupId, { text: `\`\`\`❌ Failed to send already warned message.\`\`\` ☘️Ⓜ️` });
                }
            }
        }

        // Send kicks with design
        const kickBatchSize = 10;
        if (usersToKick.length > 0) {
            for (let i = 0; i < usersToKick.length; i += kickBatchSize) {
                const batch = usersToKick.slice(i, i + kickBatchSize);
                try {
                    await sock.groupParticipantsUpdate(groupId, batch, 'remove');
                    console.log(`🚪 Kicked ${batch.length} users in batch:`, batch);
                    batch.forEach(user => delete warnedUsers[groupId][user]);
                    const kickMessage = `\`\`\`
🚪 **Members Removed** 🚪
👤 Users: ${batch.map(u => `@${u.split('@')[0]}`).join(', ')}
📅 Reason: Inactive for ${inactiveDaysThreshold} days + ${kickGracePeriodDays}-day grace period
───────────────
\`\`\` ☘️Ⓜ️`;
                    await sock.sendMessage(groupId, { 
                        text: kickMessage,
                        mentions: batch 
                    });
                    await delay(2000);
                } catch (error) {
                    console.error(`❌ Failed to kick users in batch:`, error);
                    await sock.sendMessage(groupId, { text: `\`\`\`❌ Failed to remove some inactive users. Make sure I am an admin.\`\`\` ☘️Ⓜ️` });
                }
            }
            await saveWarnedUsers(warnedUsers);
        }

        // No inactive members message
        if (usersToWarn.length === 0 && alreadyWarned.length === 0 && usersToKick.length === 0) {
            await sock.sendMessage(groupId, { text: `\`\`\`✅ No inactive members found for ${inactiveDaysThreshold} day(s).\`\`\` ☘️Ⓜ️` });
            console.log('No inactive members to warn or kick.');
        }

    } catch (error) {
        console.error("Error checking and managing inactive members:", error);
        await sock.sendMessage(groupId, { text: `\`\`\`❌ Error during inactive check.\`\`\` ☘️Ⓜ️` });
    }
}

module.exports = { checkAndManageInactive };