const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Tic-Tac-Toe command triggered');
        
        // Get the opponent user (remove ".tictactoe " part and parse the user)
        const opponent = text.trim();
        if (!opponent) {
            await sock.sendMessage(sender, { text: '🎮 Please mention a user to start a Tic-Tac-Toe game (e.g., `.tictactoe @user`). ☘️Ⓜ️' });
            return;
        }

        // Check if both players are not the same user
        if (sender === opponent) {
            await sock.sendMessage(sender, { text: '🎮 You cannot play with yourself. Please mention another user. ☘️Ⓜ️' });
            return;
        }

        // Create a game board (3x3 grid) with empty values
        const board = [
            ['_', '_', '_'],
            ['_', '_', '_'],
            ['_', '_', '_'],
        ];

        // Define the game status
        const game = {
            players: [sender, opponent], // Player 1 (X), Player 2 (O)
            currentPlayer: sender, // Player 1 starts
            board,
            status: 'waiting', // Status: waiting for opponent's reply, in progress, or ended
            turn: 1, // Track turns (1 for X's turn, 2 for O's turn)
        };

        // Save the game to some storage (can be a global variable or a database)
        global.games = global.games || [];
        global.games.push(game);

        // Notify the opponent
        await sock.sendMessage(opponent, {
            text: `🎮 ${sender} has challenged you to a Tic-Tac-Toe game! Type 'accept' to play, or 'decline' to refuse. ☘️Ⓜ️`
        });

        // Send confirmation to the challenger
        await sock.sendMessage(sender, {
            text: `🎮 You have challenged ${opponent} to a Tic-Tac-Toe game! Waiting for their response... ☘️Ⓜ️`
        });

        // Listen for the opponent's response in the chat (no prefix needed)
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            const message = chatUpdate.messages[0];
            const opponentResponse = message?.conversation?.toLowerCase();
            
            // If the opponent accepted the game
            if (message.key.remoteJid === opponent && opponentResponse === 'accept' && game.status === 'waiting') {
                // Start the game
                game.status = 'in-progress';
                await sock.sendMessage(opponent, { text: `🎮 You accepted the game! Your move. Use the number 1-9 to choose a position on the Tic-Tac-Toe board. ☘️Ⓜ️` });
                await sock.sendMessage(sender, { text: `🎮 ${opponent} accepted your challenge! Your move. Use the number 1-9 to choose a position on the Tic-Tac-Toe board. ☘️Ⓜ️` });

                // Show the initial empty board to both players
                const showBoard = () => {
                    return board.map(row => row.join(' | ')).join('\n---------\n');
                };

                await sock.sendMessage(sender, { text: `🎮 Current board:\n${showBoard()} ☘️Ⓜ️` });
                await sock.sendMessage(opponent, { text: `🎮 Current board:\n${showBoard()} ☘️Ⓜ️` });
            } 
            // If the opponent declined the game
            else if (message.key.remoteJid === opponent && opponentResponse === 'decline' && game.status === 'waiting') {
                await sock.sendMessage(sender, { text: `🎮 ${opponent} declined your Tic-Tac-Toe challenge. ☘️Ⓜ️` });
                await sock.sendMessage(opponent, { text: `🎮 You declined ${sender}'s Tic-Tac-Toe challenge. ☘️Ⓜ️` });
            }
        });

    } catch (err) {
        console.error('Error handling the tictactoe command:', err);
        await sock.sendMessage(sender, { text: 'Oops! Something went wrong. Please try again later. ☘️Ⓜ️' });
    }
};
