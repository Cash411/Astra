const { getPrefix, updatePrefix } = require('./prefixHandler');

module.exports = async (sock, sender, text) => {
    console.log(`✅ prefix.js has been triggered`);  // Confirm it runs

    if (!text) return;  

    let currentPrefix = "."; // Default prefix
try {
    currentPrefix = await getPrefix(); // Try getting the saved prefix
} catch (error) {
    console.error("Error fetching prefix:", error);
}

    console.log(`Checking prefix for message: ${text}`); 

    const trimmedText = text.trim();
    if (!trimmedText.startsWith(currentPrefix)) return; // Ensure the message starts with the prefix

    const command = trimmedText.slice(currentPrefix.length).split(' ')[0].toLowerCase();
    console.log(`Extracted Command: ${command}`);  

    if (command === 'prefix') {
        console.log(`✅ Prefix command detected!`);

        const newPrefix = trimmedText.split(' ')[1];
        if (newPrefix) {
            console.log(`Updating prefix to: ${newPrefix}`);
            await updatePrefix(newPrefix);
            await sock.sendMessage(sender, { text: `✅ Prefix changed to: ${newPrefix}` });
        } else {
            console.log(`Responding with current prefix: ${currentPrefix}`);
            await sock.sendMessage(sender, { text: `🔹 Current prefix is: ${currentPrefix}` });
        }
    }
};
