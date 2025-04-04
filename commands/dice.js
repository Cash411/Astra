const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Roll command triggered');

        // Extract the number of sides from the message text
        const sides = parseInt(text.slice(5).trim(), 10); // Remove ".roll" and trim whitespace

        // If no number is specified, default to 6 sides
        if (!sides) {
            sides = 6;
        }

        // Validate the number of sides (minimum of 2 sides)
        if (sides < 2) {
            await sock.sendMessage(sender, { text: '🎲 Please specify a valid number of sides (at least 2). ☘️Ⓜ️' });
            return;
        }

        // Simulate rolling the die (random number between 1 and the number of sides)
        const result = Math.floor(Math.random() * sides) + 1;

        // Send the result back to the user
        await sock.sendMessage(sender, { text: `🎲 You rolled a ${result} on a ${sides}-sided die! ☘️Ⓜ️` });

    } catch (err) {
        console.error('Error handling the roll command:', err);
        await sock.sendMessage(sender, { text: 'Oops! Something went wrong. Please try again later. ☘️Ⓜ️' });
    }
};
