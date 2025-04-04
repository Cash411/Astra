const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Poll command triggered');

        // Ensure the command is used in a group chat
        const groupId = msg?.key?.remoteJid;
        if (!groupId || !groupId.endsWith('@g.us')) {
            await sock.sendMessage(sender, { text: '❌ This command can only be used in group chats! ☘️Ⓜ️' });
            return;
        }

        // Extract the poll details from the message
        const pollDetails = text.slice(5).trim(); // Remove ".poll" and trim whitespace
        if (!pollDetails) {
            await sock.sendMessage(groupId, { 
                text: '❌ Please provide a poll question and options. Example:\n`.poll "What should we order?" Pizza Burgers Sushi` ☘️Ⓜ️' 
            });
            return;
        }

        // Split the poll into question and options (supporting both quoted and unquoted questions)
        let question, options;
        if (pollDetails.startsWith('"')) {
            // Handle quoted question
            const closingQuote = pollDetails.indexOf('"', 1);
            if (closingQuote === -1) {
                await sock.sendMessage(groupId, { 
                    text: '❌ Invalid poll format. Put your question in quotes. Example:\n`.poll "What should we order?" Pizza Burgers Sushi` ☘️Ⓜ️' 
                });
                return;
            }
            question = pollDetails.slice(1, closingQuote);
            options = pollDetails.slice(closingQuote + 1).trim().split(/\s+/).filter(opt => opt.length > 0);
        } else {
            // Handle unquoted question (legacy support)
            const parts = pollDetails.split(/\s+/);
            question = parts[0];
            options = parts.slice(1);
        }

        // Validate options
        if (!question || options.length < 2) {
            await sock.sendMessage(groupId, { 
                text: '❌ A poll must have a question and at least two options. Example:\n`.poll "What should we order?" Pizza Burgers Sushi` ☘️Ⓜ️' 
            });
            return;
        }

        // Format the poll message
        const pollMessage = `📊 *Poll:* ${question}\n\n${options.map((option, index) => `• ${index + 1}. ${option}`).join('\n')}\n\nVote by replying with the number of your choice! ☘️`;

        // Send the poll message
        const pollMsg = await sock.sendMessage(groupId, { text: pollMessage });

        // Store poll data for voting
        const pollId = pollMsg.key.id; // Use the message ID as the poll ID
        const pollData = {
            question,
            options,
            votes: {}, // Tracks votes (user ID -> option index)
            groupId,   // Store group ID to validate votes
        };

        // Save the poll data globally (or use a database for persistence)
        if (!global.polls) global.polls = {};
        global.polls[pollId] = pollData;

        // Notify the group
        await sock.sendMessage(groupId, { text: '🗳 Voting has started! Reply with the number of your choice to vote. ☘️' });

    } catch (error) {
        console.error('Error creating poll:', error);
        await sock.sendMessage(sender, { text: '❌ An error occurred while creating the poll. ☘️Ⓜ️' });
    }
};