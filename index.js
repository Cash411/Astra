require('dotenv').config();
const { startBot } = require('./server.js');
const { setupTempDirectory } = require('./lib/utils');

setupTempDirectory();
startBot();