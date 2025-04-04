const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        // Extract the command arguments
        const args = text.trim().split(' ');
        const opponentJid = args[0];  // Tag the opponent or use JID if in personal chat
        const challengeText = args.slice(1).join(' ').trim();  // User reply if they want to challenge

        // Check if the challenge is valid
        if (!opponentJid && !challengeText) {
            return await sock.sendMessage(sender, { text: '🎮 Please mention a user to challenge or reply to their message to start a game. Example: `.rps @user` ☘️Ⓜ️' });
        }

        // Start the challenge
        if (challengeText.toLowerCase() === 'accept') {
            // Start game if the opponent accepted the challenge
            await sock.sendMessage(sender, { text: '🎮 Challenge accepted! Choose your move: `rock`, `paper`, or `scissors` ☘️Ⓜ️' });
            // Wait for the opponent's move (handle this part with user input)
            return;  // Handling user input below in another part of the code
        }

        if (challengeText.toLowerCase() === 'decline') {
            // Handle decline if the opponent doesn't want to play
            return await sock.sendMessage(sender, { text: '❌ The challenge was declined. Maybe next time! ☘️Ⓜ️' });
        }

        // Proceed to play
        const moves = ['rock', 'paper', 'scissors'];
        const player1Choice = text.toLowerCase();  // Player 1's move from the message
        if (!moves.includes(player1Choice)) {
            return await sock.sendMessage(sender, { text: '❌ Invalid move. Please choose `rock`, `paper`, or `scissors` ☘️Ⓜ️' });
        }

        // Wait for Player 2's response
        // In an actual game implementation, you'd need to wait for Player 2's message to respond similarly

        const player2Choice = 'rock';  // Simulating Player 2's choice here (you can replace this with dynamic input)
        await sock.sendMessage(sender, { text: `🎮 Player 2 has chosen: ${player2Choice}. ☘️Ⓜ️` });

        // Determine the winner
        let result = '';
        if (player1Choice === player2Choice) {
            result = 'It\'s a draw! Both players chose ' + player1Choice + '.';
        } else if (
            (player1Choice === 'rock' && player2Choice === 'scissors') ||
            (player1Choice === 'paper' && player2Choice === 'rock') ||
            (player1Choice === 'scissors' && player2Choice === 'paper')
        ) {
            result = '🎉 Player 1 wins! ' + player1Choice + ' beats ' + player2Choice + '.';
        } else {
            result = '🎉 Player 2 wins! ' + player2Choice + ' beats ' + player1Choice + '.';
        }

        // Send the result of the game
        await sock.sendMessage(sender, { text: result + ' ☘️Ⓜ️' });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(sender, { text: '❌ Something went wrong while processing the game. Please try again later. ☘️Ⓜ️' });
    }
};
