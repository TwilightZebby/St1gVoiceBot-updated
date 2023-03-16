const { DiscordClient } = require("./constants.js");
const Config = require("./config.js");

// Bring in Slash Commands for (un)registering
const ConfigCommand = require('./Interactions/SlashCommands/config.js');
const VoiceCommand = require('./Interactions/SlashCommands/voice.js');

// Login Bot
DiscordClient.login(Config.TOKEN);

// Wait for Ready
DiscordClient.once('ready', async () => {
    // Register a SINGLE Command
    //await DiscordClient.application.commands.create(ConfigCommand.registerData());

    // Register multiple Commands
    const CommandDataArray = [
        ConfigCommand.registerData(), VoiceCommand.registerData()
    ];

    //await DiscordClient.application.commands.set(CommandDataArray); // Registers commands globally (for all Servers the Bot is in)

    // UNregister all Commands
    //await DiscordClient.application.commands.set([]);

    console.log("Deployed Commands!");
    process.exit();
});






/******************************************************************************* */
// DEBUGGING AND ERROR LOGGING
// Warnings
process.on('warning', (warning) => { return console.warn("***WARNING: ", warning); });
DiscordClient.on('warn', (warning) => { return console.warn("***DISCORD WARNING: ", warning); });

// Unhandled Promise Rejections
process.on('unhandledRejection', (err) => { return console.error("***UNHANDLED PROMISE REJECTION: ", err); });

// Discord Errors
DiscordClient.on('error', (err) => { return console.error("***DISCORD ERROR: ", err); });
