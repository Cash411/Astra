const { getPrefix } = require('./prefixHandler');
module.exports = async (sock, sender, text, msg) => {
    const calculation = text.slice(5).trim();  // Remove '.calc ' to get the actual expression

    if (!calculation) {
        await sock.sendMessage(sender, { text: "❌ Please provide a calculation to perform. Example: .calc 5+3 ☘️Ⓜ️" });
        return;
    }

    try {
        // Perform the calculation using eval (be cautious with user input!)
        const result = eval(calculation);
        await sock.sendMessage(sender, { text: `💡 The result of your calculation is: ${result} ☘️Ⓜ️` });
    } catch (error) {
        console.error("❌ Error performing calculation:", error);
        await sock.sendMessage(sender, { text: "❌ Failed to perform the calculation. Please check the input format. ☘️Ⓜ️" });
    }
};
