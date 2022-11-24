const { RateLimitError, DMChannel, CategoryChannel, PermissionsBitField, PermissionFlagsBits, ChannelType } = require("discord.js");
const fs = require("fs");
const { DiscordClient, Collections } = require("./constants.js");
const Config = require("./config.js");



/******************************************************************************* */
// BRING IN FILES FOR COMMANDS AND INTERACTIONS
// Text Commands
const TextCommandFiles = fs.readdirSync("./TextCommands").filter(file => file.endsWith(".js"));
for ( const File of TextCommandFiles )
{
    const TempCommand = require(`./TextCommands/${File}`);
    Collections.TextCommands.set(TempCommand.Name, TempCommand);
}

// Slash Commands
const SlashCommandFiles = fs.readdirSync("./Interactions/SlashCommands").filter(file => file.endsWith(".js"));
for ( const File of SlashCommandFiles )
{
    const TempCommand = require(`./Interactions/SlashCommands/${File}`);
    Collections.SlashCommands.set(TempCommand.Name, TempCommand);
}

// Context Commands
const ContextCommandFiles = fs.readdirSync("./Interactions/ContextCommands").filter(file => file.endsWith(".js"));
for ( const File of ContextCommandFiles )
{
    const TempCommand = require(`./Interactions/ContextCommands/${File}`);
    Collections.ContextCommands.set(TempCommand.Name, TempCommand);
}

// Buttons
const ButtonFiles = fs.readdirSync("./Interactions/Buttons").filter(file => file.endsWith(".js"));
for ( const File of ButtonFiles )
{
    const TempButton = require(`./Interactions/Buttons/${File}`);
    Collections.Buttons.set(TempButton.Name, TempButton);
}

// Selects
const SelectFiles = fs.readdirSync("./Interactions/Selects").filter(file => file.endsWith(".js"));
for ( const File of SelectFiles )
{
    const TempSelect = require(`./Interactions/Selects/${File}`);
    Collections.Selects.set(TempSelect.Name, TempSelect);
}

// Modals
const ModalFiles = fs.readdirSync("./Interactions/Modals").filter(file => file.endsWith(".js"));
for ( const File of ModalFiles )
{
    const TempModal = require(`./Interactions/Modals/${File}`);
    Collections.Modals.set(TempModal.Name, TempModal);
}








/******************************************************************************* */
// DISCORD - READY EVENT
DiscordClient.once('ready', () => {
    DiscordClient.user.setPresence({ status: 'online' });
    console.log(`${DiscordClient.user.username}#${DiscordClient.user.discriminator} is online and ready!`);
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

// Discord Rate Limit - Only uncomment when debugging
//DiscordClient.rest.on('rateLimited', (RateLimitError) => { return console.log("***DISCORD RATELIMIT HIT: ", RateLimitError); });








/******************************************************************************* */
// DISCORD - MESSAGE CREATE EVENT
const TextCommandHandler = require("./BotModules/Handlers/TextCommandHandler.js");

DiscordClient.on('messageCreate', async (message) => {
    // Partials
    if ( message.partial ) { return; }

    // Bots
    if ( message.author.bot ) { return; }

    // System Messages
    if ( message.system || message.author.system ) { return; }

    // DM Channel Messages
    if ( message.channel instanceof DMChannel ) { return; }

    // Safe-guard against Discord Outages
    if ( !message.guild.available ) { return; }



    // Check for (and handle) Commands
    let textCommandStatus = await TextCommandHandler.Main(message);
    if ( textCommandStatus === false )
    {
        // No Command detected
        return;
    }
    else if ( textCommandStatus === null )
    {
        // Prefix was detected, but wasn't a command on the bot
        return;
    }
    else
    {
        // Command failed or successful
        return;
    }
});








/******************************************************************************* */
// DISCORD - INTERACTION CREATE EVENT
const SlashCommandHandler = require("./BotModules/Handlers/SlashCommandHandler.js");
const ContextCommandHandler = require("./BotModules/Handlers/ContextCommandHandler.js");
const ButtonHandler = require("./BotModules/Handlers/ButtonHandler.js");
const SelectHandler = require("./BotModules/Handlers/SelectHandler.js");
const AutocompleteHandler = require("./BotModules/Handlers/AutocompleteHandler.js");
const ModalHandler = require("./BotModules/Handlers/ModalHandler.js");

DiscordClient.on('interactionCreate', async (interaction) => {
    if ( interaction.isChatInputCommand() )
    {
        // Slash Command
        return await SlashCommandHandler.Main(interaction);
    }
    else if ( interaction.isContextMenuCommand() )
    {
        // Context Command
        return await ContextCommandHandler.Main(interaction);
    }
    else if ( interaction.isButton() )
    {
        // Button
        return await ButtonHandler.Main(interaction);
    }
    else if ( interaction.isSelectMenu() )
    {
        // Select
        return await SelectHandler.Main(interaction);
    }
    else if ( interaction.isAutocomplete() )
    {
        // Autocomplete
        return await AutocompleteHandler.Main(interaction);
    }
    else if ( interaction.isModalSubmit() )
    {
        // Modal
        return await ModalHandler.Main(interaction);
    }
    else
    {
        // Unknown or unhandled new type of Interaction
        return console.log(`****Unrecognised or new unhandled Interaction type triggered:\n${interaction.type}\n${interaction}`);
    }
});








/******************************************************************************* */
// DISCORD - VOICE STATE UPDATE EVENT
const TempVoiceChannelModule = require('./BotModules/TempVoiceChannelModule.js');
const TempVCLoggingModule = require('./BotModules/TempVCLoggingModule.js');

DiscordClient.on("voiceStateUpdate", async (oldState, newState) => {
    // Grab JSONs so we can ignore any Voice States NOT from Temp VCs
    const VoiceSettings = require('./JsonFiles/hidden/guildSettings.json');
    const ActiveTempVoices = require('./JsonFiles/hidden/activeTempVoices.json');
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);

    // Check Guild actually has settings set
    if ( ( oldState.channelId == null || !VoiceSettings[oldState.guild.id] ) && ( newState.channelId == null || !VoiceSettings[newState.guild.id] ) )
    {
        //console.log("NO SETTINGS SET");
        return;
    }

    // Voice State Updates that do NOT come from a Temp VC
    if ( oldState.channel?.parentId !== VoiceSettings[`${oldState.guild.id}`]["PARENT_CATEGORY_ID"] && newState.channel?.parentId !== VoiceSettings[`${newState.guild.id}`]["PARENT_CATEGORY_ID"] )
    { 
        //console.log("NOT A TEMP VC");

        // Check if this is a Member joining the Source VC
        if ( oldState.channelId == null && newState.channelId === VoiceSettings[`${newState.guild.id}`]["SOURCE_VC_ID"] )
        {
            //console.log("IS SOURCE VC THOUGH");

            // Data needed
            const VoiceCreatorId = newState.id;

            // Check if Member already owns an existing Temp VC
            const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === VoiceCreatorId);
            if ( CheckExistingVC.length > 0 )
            {
                // Member already owns a Temp VC - as such move them to that VC
                await newState.setChannel(CheckExistingVC[0]["VOICE_CHANNEL_ID"]);
                return;
            }
            else
            {
                // Member doesn't own a Temp VC already - so make new one for them
                const GuildId = newState.guild.id;
                const GuildSettings = VoiceSettings[GuildId];
                // Grab Parent Temp VC Category
                const ParentCategoryId = GuildSettings["PARENT_CATEGORY_ID"];
                /** @type {CategoryChannel} */
                const FetchedCategory = await newState.guild.channels.fetch(ParentCategoryId);

                // Verify Bot has Permissions
                /** @type {PermissionsBitField} */
                const BotPermissions = FetchedCategory.permissionsFor(DiscordClient.user.id);
                if ( !BotPermissions.has(PermissionFlagsBits.ViewChannel) || !BotPermissions.has(PermissionFlagsBits.ManageChannels) || !BotPermissions.has(PermissionFlagsBits.ReadMessageHistory) )
                {
                    await newState.channel.send({ allowedMentions: { users: [VoiceCreatorId] }, content: `Sorry <@${VoiceCreatorId}>, but I cannot create a new Temp Voice Channel for you, since I am missing required Permissions for the **<#${ParentCategoryId}>** Category. Please ask this Server's Admins or Owner to fix this!

Permissions I require in **<#${ParentCategoryId}>** :
- \`View Channels\`
- \`Manage Channels\`
- \`Read Message History\`` });
                    return;
                }


                // Create Temp VC!
                await newState.guild.channels.create({
                    type: ChannelType.GuildVoice,
                    parent: ParentCategoryId,
                    name: `${newState.member.user.username}`,
                    reason: `${newState.member.user.username}#${newState.member.user.discriminator} created a new Temp VC`
                })
                .then(async (CreatedVoiceChannel) => {
                    // Voice Channel Created
                    // Create Permission Overwrites for Channel Owner & Bot
                    await CreatedVoiceChannel.permissionOverwrites.edit(VoiceCreatorId, { ViewChannel: true, Connect: true, ManageChannels: true });
                    await CreatedVoiceChannel.permissionOverwrites.edit(DiscordClient.user.id, { ViewChannel: true, Connect: true, ManageChannels: true, ReadMessageHistory: true });

                    // Save to JSON
                    let newVoice = {
                        "VOICE_CHANNEL_ID": CreatedVoiceChannel.id,
                        "CHANNEL_OWNER_ID": VoiceCreatorId,
                        "CHANNEL_CREATOR_ID": VoiceCreatorId
                    };
                    ActiveTempVoices[CreatedVoiceChannel.id] = newVoice;
                    fs.writeFile('./JsonFiles/hidden/activeTempVoices.json', JSON.stringify(ActiveTempVoices, null, 4), async (err) => {
                        if (err) { 
                            //console.error(err);
                        }
                    });

                    // Move Member into VC
                    await newState.setChannel(CreatedVoiceChannel.id);

                    // Send message into VC (thanks to TiV)
                    await CreatedVoiceChannel.send({ allowedMentions: { users: [VoiceCreatorId] }, content: `*Temp VC | Creator: <@${VoiceCreatorId}>*

Welcome to your personal Voice Channel!
It will be removed once every Member has left the Voice Channel. If you need help, use the </voice help:1024978099303104532> Command - and remember to follow this Server's Rules!\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬` });

                    // Log Creation
                    await TempVCLoggingModule.logCreation(CreatedVoiceChannel, newState.member);

                    return;
                })
                .catch( async (err) => {
                    //console.error(err);
                    await newState.channel.send({ allowedMentions: { users: [VoiceCreatorId] }, content: `Sorry <@${VoiceCreatorId}>, something went wrong while trying to create your Temp Voice Channel... Please try again in a moment.` });
                });

                return;
            }
        }
        return;
    }




    // Member JOINED a Temp VC
    if ( oldState.channelId == null && newState.channelId != null )
    {
        //console.log(`Member ${newState.member?.displayName} JOINED the Voice Channel ${newState.channel?.name}`);

        // Log in VC's TC that a member joined the Temp VC
        await TempVCLoggingModule.logMemberConnect(newState);

        return;
    }
    



    // Member SWAPPED BETWEEN VCs
    //     Either from a Temp VC to any other VC,
    //     OR from any other VC into a Temp VC,
    //     OR from one Temp VC into another Temp VC
    if ( oldState.channelId != null && newState.channelId != null )
    {
        //console.log(`Member ${newState.member?.displayName} SWAPPED from the Voice Channel ${oldState.channel?.name} TO ${newState.channel?.name}`);

        // Prevent voice state updates, like screenshares and Activities, from triggering this
        if ( oldState.channelId === newState.channelId ) { return; }

        // Check to see if previous VC was a Temp VC
        if ( oldState.channel?.parentId === VoiceSettings[`${oldState.guild.id}`]["PARENT_CATEGORY_ID"] )
        {
            // Log into Temp VC's TC that the Member left it
            await TempVCLoggingModule.logMemberDisconnect(oldState);

            // IS a Temp VC, so now check if empty
            if ( await TempVoiceChannelModule.isTempVoiceChannelEmpty(oldState) )
            {
                // Temp VC *is* empty, delete it
                await TempVoiceChannelModule.deleteTempVoiceChannel(oldState);
            }
        }
        // Check if new VC is a Temp VC
        else if ( newState.channel?.parentId === VoiceSettings[`${newState.guild.id}`]["PARENT_CATEGORY_ID"] )
        {
            // Log into Temp VC's TC that the Member joined it
            await TempVCLoggingModule.logMemberConnect(newState);
        }

        return;
    }
    



    // Member LEFT a Temp VC
    if ( oldState.channelId != null && newState.channelId == null )
    {
        //console.log(`Member ${oldState.member?.displayName} LEFT the Voice Channel ${oldState.channel?.name}`);

        // Log in Temp VC's TC that the Member disconnected
        await TempVCLoggingModule.logMemberDisconnect(oldState);

        // Do nothing if Temp VC is not empty
        if ( await TempVoiceChannelModule.isTempVoiceChannelEmpty(oldState) )
        {
            // Temp VC *is* empty, delete it
            await TempVoiceChannelModule.deleteTempVoiceChannel(oldState);
        }
        return;
    }

    //console.log("THIS SHOULD NOT BE SEENED OUTPUTTED TO CONSOLE");
    return;
});








/******************************************************************************* */

DiscordClient.login(Config.TOKEN);
