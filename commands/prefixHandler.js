const fs = require('fs');
const path = require('path');

const prefixFile = path.join(__dirname, '../database/prefix.json');

async function getPrefix() {
    try {
        const data = await fs.promises.readFile(prefixFile, 'utf-8');
        const json = JSON.parse(data);
        console.log(`Loaded Prefix: ${json.prefix}`);
        return json.prefix || '.';
    } catch (error) {
        console.error('Error reading prefix:', error);
        return '.';
    }
}

async function updatePrefix(newPrefix) {
    try {
        console.log(`Updating prefix to: ${newPrefix}`);
        await fs.promises.writeFile(prefixFile, JSON.stringify({ prefix: newPrefix }), 'utf-8');
    } catch (error) {
        console.error('Error updating prefix:', error);
    }
}

module.exports = { getPrefix, updatePrefix };