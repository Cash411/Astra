const { getPrefix } = require('./prefixHandler');
const moment = require('moment');
const { scheduleJob } = require('node-schedule');

// Store active reminders
const reminders = new Map();

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Remind command triggered ☘️Ⓜ️');
        const prefix = await getPrefix();

        // Parse command: .remind [me] to [task] in [time]
        const args = text.split(' ').slice(1);
        if (args.length < 4 || !text.includes(' to ') || !text.includes(' in ')) {
            await sock.sendMessage(sender, {
                text: `\`\`\`❌ Invalid format! Usage:\n${prefix}remind me to [task] in [time]\nExamples:\n${prefix}remind me to call mom in 1 hour\n${prefix}remind me to take pills in 30 minutes\`\`\` ☘️Ⓜ️`
            });
            return;
        }

        const task = text.split(' to ')[1].split(' in ')[0].trim();
        const timeStr = text.split(' in ')[1].trim();

        // Parse time duration
        const duration = moment.duration(
            parseInt(timeStr.split(' ')[0]), 
            timeStr.split(' ')[1]
        );
        
        if (!duration.isValid() || duration.asMilliseconds() <= 0) {
            await sock.sendMessage(sender, {
                text: '```❌ Invalid time duration! Use format like "1 hour" or "30 minutes"``` ☘️Ⓜ️'
            });
            return;
        }

        const reminderTime = new Date(Date.now() + duration.asMilliseconds());
        const reminderId = `${sender}-${Date.now()}`;

        // Schedule reminder
        scheduleJob(reminderTime, async () => {
            await sock.sendMessage(sender, {
                text: `\`\`\`⏰ REMINDER ⏰\n\n${task}\`\`\` ☘️Ⓜ️`
            });
            reminders.delete(reminderId);
        });

        reminders.set(reminderId, {
            task,
            time: reminderTime,
            user: sender
        });

        await sock.sendMessage(sender, {
            text: `\`\`\`✅ Reminder set!\n\nTask: ${task}\nTime: ${reminderTime.toLocaleString()}\`\`\` ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Remind error:', error);
        await sock.sendMessage(sender, {
            text: '```❌ Failed to set reminder! Try again.``` ☘️Ⓜ️'
        });
    }
};