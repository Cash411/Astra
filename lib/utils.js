const fs = require('fs');
const path = require('path');

function setupTempDirectory() {
    const tempDir = path.join(__dirname, '../temp');
    try {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log('🧹 Cleaned up existing temp directory');
        }
        fs.mkdirSync(tempDir);
        console.log('📁 Created temp directory for media storage');
        fs.writeFileSync(path.join(tempDir, '.gitkeep'), '');
    } catch (error) {
        console.error('❌ Failed to setup temp directory:', error);
        process.exit(1);
    }
}

function cleanupTempDirectory() {
    const tempDir = path.join(__dirname, '../temp');
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('✅ Temp directory cleaned');
    } catch (error) {
        console.error('❌ Failed to cleanup temp directory:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n🧹 Cleaning up before exit...');
    cleanupTempDirectory();
    process.exit(0);
});

module.exports = { setupTempDirectory, cleanupTempDirectory };