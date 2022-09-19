A simple template Discord Bot for myself.

# Setup Guide
*Assumes you've already cloned this, and have NodeJS*

1. [Install Discord.JS](https://discord.js.org/#/docs/discord.js/main/general/welcome) (Currently this template is based on [D.JS v14.3.0](https://discord.js.org/#/docs/discord.js/14.3.0/general/welcome))
2. Ensure you have the following Folders ***in the root*** - as these are where the Bot will look for the Commands and Interactions
    - `./Interactions/Buttons/`
    - `./Interactions/ContextCommands/`
    - `./Interactions/Modals/`
    - `./Interactions/Selects/`
    - `./Interactions/SlashCommands/`
    - `./TextCommands/`
3. Create a `config.js` file ***in the root***, with the following information (replace strings with relevant data of course):

```js
exports.TOKEN = 'BOT-TOKEN'; // Your Discord Bot's Token, found on Developer Portal

exports.PREFIX = 'PREFIX'; // Prefix for TEXT BASED Commands

exports.BotDevID = 'USERID'; // Discord User ID of the Bot's Developer - for "Bot Developer Only" commands

exports.ErrorLogGuildID = "GUILDID"; // Discord Guild ID for the Guild you use to test in, and to register the /register and /unregister commands in
```

4. Run the `./deployCommands.js` file ( `node deployCommands.js` ) to register the Slash Commands used for (un)registering other Slash/Context Commands to/from Discord's API.
    - *This only needs to be run once, you do not need this running for the functionality of the Bot!*
5. Run `./index.js` to run the actual Bot. ( `node index.js` )

> **Note**
> The Localised Response Strings in `./JsonFiles/errorMessages.json` and `/JsonFiles/stringMessages.js` haven't been localised yet and still use British English. This is mainly because I don't have the abilities to accurately translate them myself.
