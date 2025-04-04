const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Flip command triggered');

        // Simulate flipping the coin (randomly choose Heads or Tails)
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        // Send the result back to the user
        await sock.sendMessage(sender, { text: `🪙 You flipped: ${result}! ☘️Ⓜ️` });

    } catch (err) {
        console.error('Error handling the flip command:', err);
        await sock.sendMessage(sender, { text: 'Oops! Something went wrong. Please try again later. ☘️Ⓜ️' });
    }
};
