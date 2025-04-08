const showBoard = (board) => {
    const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    let display = '```\n';
    let numIndex = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            display += board[i][j] === '_' ? numbers[numIndex] : (board[i][j] === 'X' ? '❌' : '⭕');
            numIndex++;
            if (j < 2) display += ' | ';
        }
        if (i < 2) display += '\n──┼──┼──\n';
    }
    display += '\n```';
    return display;
};

const checkWinner = (board) => {
    const lines = [
        ...board,
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]],
        ...[0, 1, 2].map(col => board.map(row => row[col]))
    ];
    for (const line of lines) {
        if (line.every(cell => cell === 'X')) return 'X';
        if (line.every(cell => cell === 'O')) return 'O';
    }
    return null;
};

const startTicTacToe = (sock, challenger, opponent, chatJid) => {
    const board = [
        ['_', '_', '_'],
        ['_', '_', '_'],
        ['_', '_', '_']
    ];
    const game = {
        players: [challenger, opponent],
        board,
        status: 'waiting',
        turn: 0,
        id: `${challenger}-${opponent}-${Date.now()}`,
        chatJid
    };

    global.games = global.games || [];
    global.games.push(game);

    const isGroup = chatJid.endsWith('@g.us');
    const mention = (jid) => isGroup ? `@${jid.split('@')[0]}` : jid.split('@')[0];
    const mentions = isGroup ? [challenger, opponent] : [];

    sock.sendMessage(chatJid, { 
        text: `🎮 ${mention(challenger)} challenged ${mention(opponent)} to Tic-Tac-Toe! Reply \`accept\` or \`decline\`. ☘️Ⓜ️`,
        mentions
    });
    sock.sendMessage(chatJid, { 
        text: `🎮 You challenged ${mention(opponent)}! Waiting for their response... ☘️Ⓜ️`,
        mentions: isGroup ? [challenger, opponent] : []
    });

    return game.id;
};

const handleTicTacToeUpdate = async (sock, msg) => {
    const chatJid = msg.key.remoteJid;
    const sender = chatJid.endsWith('@g.us') ? msg.key.participant : msg.key.remoteJid;
    const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').toLowerCase().trim();

    if (!text) return;

    const game = global.games?.find(g => {
        const matchWaiting = g.chatJid === chatJid && g.status === 'waiting' && g.players[1] === sender;
        const matchInProgress = g.chatJid === chatJid && g.status === 'in-progress' && g.players.includes(sender);
        return matchWaiting || matchInProgress;
    });

    if (!game) return;

    const isGroup = chatJid.endsWith('@g.us');
    const mention = (jid) => isGroup ? `@${jid.split('@')[0]}` : jid.split('@')[0];
    const mentions = (jids) => isGroup ? jids : [];

    if (game.status === 'waiting' && sender === game.players[1]) {
        if (text === 'accept') {
            game.status = 'in-progress';
            await sock.sendMessage(chatJid, { 
                text: `🎮 ${mention(game.players[1])} accepted!\n${mention(game.players[0])} (X), you're up! Pick a spot (1-9):\n${showBoard(game.board)}`,
                mentions: mentions([game.players[0], game.players[1]])
            });
        } else if (text === 'decline') {
            await sock.sendMessage(chatJid, { 
                text: `🎮 ${mention(game.players[1])} declined ${mention(game.players[0])}'s challenge. Game over! ☘️Ⓜ️`,
                mentions: mentions([game.players[0], game.players[1]])
            });
            global.games = global.games.filter(g => g !== game);
        } else {
            await sock.sendMessage(chatJid, { 
                text: `🎮 Please reply with \`accept\` or \`decline\`, ${mention(sender)}! ☘️Ⓜ️`,
                mentions: mentions([sender])
            });
        }
    } else if (game.status === 'in-progress' && sender === game.players[game.turn]) {
        const move = parseInt(text);
        if (isNaN(move) || move < 1 || move > 9) {
            await sock.sendMessage(chatJid, { 
                text: `🎮 Invalid move, ${mention(sender)}! Use 1-9. ☘️Ⓜ️`,
                mentions: mentions([sender])
            });
            return;
        }

        const [row, col] = [(Math.floor((move - 1) / 3)), (move - 1) % 3];
        if (game.board[row][col] !== '_') {
            await sock.sendMessage(chatJid, { 
                text: `🎮 Spot ${move} is taken, ${mention(sender)}! Try another. ☘️Ⓜ️`,
                mentions: mentions([sender])
            });
            return;
        }

        game.board[row][col] = game.turn === 0 ? 'X' : 'O';

        const winner = checkWinner(game.board);
        if (winner) {
            await sock.sendMessage(chatJid, { 
                text: `🎮 Game Over: ${mention(winner === 'X' ? game.players[0] : game.players[1])} wins with ${winner}!\n${showBoard(game.board)}\nGG, ${mention(game.players[0])} and ${mention(game.players[1])}! ☘️Ⓜ️`,
                mentions: mentions([game.players[0], game.players[1]])
            });
            global.games = global.games.filter(g => g !== game);
        } else if (game.board.flat().every(cell => cell !== '_')) {
            await sock.sendMessage(chatJid, { 
                text: `🎮 Game Over: It’s a draw!\n${showBoard(game.board)}\nThanks for playing, ${mention(game.players[0])} and ${mention(game.players[1])}! ☘️Ⓜ️`,
                mentions: mentions([game.players[0], game.players[1]])
            });
            global.games = global.games.filter(g => g !== game);
        } else {
            game.turn = 1 - game.turn;
            const nextPlayer = game.players[game.turn];
            await sock.sendMessage(chatJid, { 
                text: `🎮 Move recorded!\n${showBoard(game.board)}\n${mention(nextPlayer)} (${game.turn === 0 ? 'X' : 'O'}), your turn! Pick 1-9. ☘️Ⓜ️`,
                mentions: mentions([nextPlayer])
            });
        }
    } else if (game.status === 'in-progress' && sender !== game.players[game.turn]) {
        await sock.sendMessage(chatJid, { 
            text: `🎮 Not your turn, ${mention(sender)}! Wait for ${mention(game.players[game.turn])}. ☘️Ⓜ️`,
            mentions: mentions([sender, game.players[game.turn]])
        });
    }
};

module.exports = { startTicTacToe, handleTicTacToeUpdate, showBoard, checkWinner };