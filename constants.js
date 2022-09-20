const { Client, GatewayIntentBits, Collection } = require("discord.js");

module.exports =
{
    // Discord Client representing the Bot/App
    DiscordClient: new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildVoiceStates ] }),

    // Collections that are used in many locations
    Collections: {
        TextCommands: new Collection(),
        SlashCommands: new Collection(),
        ContextCommands: new Collection(),
        Buttons: new Collection(),
        Selects: new Collection(),
        Modals: new Collection(),

        TextCooldowns: new Collection(),
        SlashCooldowns: new Collection(),
        ContextCooldowns: new Collection(),
        ButtonCooldowns: new Collection(),
        SelectCooldowns: new Collection()
    }
}
