const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'commands');

const loadCommands = () => {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    const commands = {};

    commandFiles.forEach(file => {
        const command = require(path.join(commandsDir, file));
        commands[file.replace('.js', '')] = command;  // Store commands by filename
    });

    return commands;
};

module.exports = loadCommands;