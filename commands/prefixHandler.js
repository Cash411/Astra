const fs = require("fs");
const path = require("path");

const prefixFile = path.join(__dirname, "prefix.json");

// Function to get the current prefix
async function getPrefix() {
    try {
        const data = await fs.promises.readFile(prefixFile, "utf-8");
        const json = JSON.parse(data);
        console.log(`Loaded Prefix: ${json.prefix}`);  // Debugging log
        return json.prefix || '.';  // Default to '.' if not set
    } catch (error) {
        console.error("Error reading prefix:", error);
        return '.';  // Default prefix in case of an error
    }
}

// Function to update the prefix
async function updatePrefix(newPrefix) {
    try {
        console.log(`Updating prefix to: ${newPrefix}`); // Debugging log
        await fs.promises.writeFile(prefixFile, JSON.stringify({ prefix: newPrefix }), "utf-8");
    } catch (error) {
        console.error("Error updating prefix:", error);
    }
}

module.exports = { getPrefix, updatePrefix };
