const { ChatInputCommandInteraction, ChatInputApplicationCommandData, AutocompleteInteraction, ApplicationCommandType, ApplicationCommandOptionType, CategoryChannel, PermissionFlagsBits, PermissionsBitField, ChannelType, VoiceChannel, EmbedBuilder, Colors } = require("discord.js");
const fs = require('fs');
const { DiscordClient, Collections } = require("../../constants.js");
const LocalizedErrors = require("../../JsonFiles/errorMessages.json");
const LocalizedStrings = require("../../JsonFiles/stringMessages.json");

module.exports = {
    // Command's Name
    //     Use full lowercase
    Name: "voice",

    // Command's Description
    Description: `Main Temp VC Command, used for creating and managing Temp Voice Channels`,

    // Command's Category
    Category: "GENERAL",

    // Cooldown, in seconds
    //     Defaults to 3 seconds if missing
    Cooldown: 20,

    // Cooldowns for specific subcommands and/or subcommand-groups
    //     IF SUBCOMMAND: name as "subcommandName"
    //     IF SUBCOMMAND GROUP: name as "subcommandGroupName_subcommandName"
    SubcommandCooldown: {
        "create": 120,
        "help": 30,
        "unlock": 30,
        "lock": 30,
        "rename": 60,
        "limit": 30
    },

    // Scope of Command's usage
    //     One of the following: DM, GUILD, ALL
    Scope: "GUILD",
    
    // Scope of specific Subcommands Usage
    //     One of the following: DM, GUILD, ALL
    //     IF SUBCOMMAND: name as "subcommandName"
    //     IF SUBCOMMAND GROUP: name as "subcommandGroupName_subcommandName"
    SubcommandScope: {
        "create": "GUILD",
        "help": "GUILD",
        "unlock": "GUILD",
        "lock": "GUILD",
        "rename": "GUILD",
        "limit": "GUILD"
    },



    /**
     * Returns data needed for registering Slash Command onto Discord's API
     * @returns {ChatInputApplicationCommandData}
     */
    registerData()
    {
        /** @type {ChatInputApplicationCommandData} */
        const Data = {};

        Data.name = this.Name;
        Data.description = this.Description;
        Data.type = ApplicationCommandType.ChatInput;
        Data.dmPermission = false;
        Data.options = [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "create",
                description: "Create a new Temp Voice Channel"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "help",
                description: "Shows what you can do with your Temp Voice Channel"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "unlock",
                description: "Unlocks your Temp Voice Channel so anyone can join it"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "lock",
                description: "Locks your Temp Voice Channel so only those you permit can join it"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "rename",
                description: "Change the name of your Temp Voice Channel",
                options: [{
                        type: ApplicationCommandOptionType.String,
                        name: "name",
                        description: "The new name you want",
                        min_length: 1,
                        max_length: 100,
                        required: true
                    }]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "limit",
                description: "Set or remove a limit on how many Members can join the VC",
                options: [{
                        type: ApplicationCommandOptionType.Integer,
                        name: "limit",
                        description: "The limit you want - type 0 (zero) to remove the Member limit",
                        min_value: 0,
                        max_value: 99,
                        required: true
                    }]
            }
        ];

        return Data;
    },



    /**
     * Executes the Slash Command
     * @param {ChatInputCommandInteraction} slashCommand 
     */
    async execute(slashCommand)
    {
        // Get Subcommand used
        const SubcommandUsed = slashCommand.options.getSubcommand(true);
        switch (SubcommandUsed)
        {
            case "create":
                return await createTempVoice(slashCommand);

            case "help":
                return await showHelp(slashCommand);

            case "unlock":
                return await unlockTempVoice(slashCommand);

            case "lock":
                return await lockTempVoice(slashCommand);

            case "rename":
                return await renameTempVoice(slashCommand);

            case "limit":
                return await limitTempVoice(slashCommand);
        }
    },



    /**
     * Handles given Autocomplete Interactions for any Options in this Slash CMD that uses it
     * @param {AutocompleteInteraction} autocompleteInteraction 
     */
    async autocomplete(autocompleteInteraction)
    {
        //.
    }
}





/**
* Used to check if the Command was used by a VC Owner & in a VC
* @param {ChatInputCommandInteraction} slashCommand
* @returns {Boolean}
*/
async function canCommandBeUsed(slashCommand)
{
    // Bring in JSONs
    const VoiceSettings = require('../../JsonFiles/hidden/guildSettings.json');
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');

    // Verify Command User does own an active Temp VC
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === slashCommand.member.id);
    if ( CheckExistingVC.length < 1 || !CheckExistingVC.length || !CheckExistingVC )
    { 
        await slashCommand.reply({ ephemeral: true, content: `You can only use this Command if you own a Temp Voice Channel!` });
        return false;
    }

    // Ensure Command was used in a Temp VC
    if ( slashCommand.channel.parentId !== VoiceSettings[slashCommand.guildId]["PARENT_CATEGORY_ID"] )
    { 
        await slashCommand.reply({ ephemeral: true, content: `This Command cannot be used outside of Temp VCs!\nPlease go into the [Text Chat](<https://support.discord.com/hc/en-us/articles/4412085582359-Text-Channels-Text-Chat-In-Voice-Channels#h_01FMJT3SP072ZFJCZWR0EW6CJ1>) of your Voice Channel in order to use this Command.` });
        return false;
    }

    // Command can be used
    return true;
}





/**
* Handles the "/voice help" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function showHelp(slashCommand)
{
    // Check Command can be used
    if ( await canCommandBeUsed(slashCommand) === false ) { return; }

    // Construct & Display Temp VC Help
    await slashCommand.deferReply();

    const HelpEmbed = new EmbedBuilder().setColor(Colors.Aqua)
    .setTitle(`St1gVoiceBot's Available Commands`)
    .setDescription(`These are all the Commands you can use to manage your Temp Voice Channel!`)
    .addFields(
        { name: `Lock Channel`, value: `</voice lock:${slashCommand.commandId}>`, inline: true },
        { name: `Unlock Channel`, value: `</voice unlock:${slashCommand.commandId}>`, inline: true },
        { name: `Rename Channel`, value: `</voice rename:${slashCommand.commandId}>`, inline: true },
        { name: `Set User Limit`, value: `</voice limit:${slashCommand.commandId}>`, inline: true },
        { name: `Permit User`, value: `</voice permit:${slashCommand.commandId}>`, inline: true },
        { name: `Reject User`, value: `</voice reject:${slashCommand.commandId}>`, inline: true },
        { name: `Vanish Channel`, value: `</voice vanish:${slashCommand.commandId}>`, inline: true },
        { name: `Unvanish Channel`, value: `</voice unvanish:${slashCommand.commandId}>`, inline: true },
        { name: `Claim Channel Ownership`, value: `</voice claim:${slashCommand.commandId}>` },
        { name: `Transfer Channel Ownership`, value: `</voice transfer:${slashCommand.commandId}>` }
    );

    return await slashCommand.editReply({ embeds: [HelpEmbed] });
}





/**
* Handles the "/voice limit" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function limitTempVoice(slashCommand)
{
    // Check Command can be used
    if ( await canCommandBeUsed(slashCommand) === false ) { return; }

    // Bring in JSONs
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');

    // Grab VC
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === slashCommand.member.id);

    // Fetch input
    const InputNewLimit = slashCommand.options.getInteger("limit", true);

    // Rename VC
    await slashCommand.deferReply();

    /** @type {VoiceChannel} */
    const FetchedVoiceChannel = await slashCommand.guild.channels.fetch(CheckExistingVC[0]["VOICE_CHANNEL_ID"]);
    await FetchedVoiceChannel.edit({ userLimit: InputNewLimit })
    .then(async () => { await slashCommand.editReply({ content: InputNewLimit === 0 ? `Removed the Member Limit for your Temp Voice Channel` : `Set the Member Limit for your Temp Voice Channel to ${InputNewLimit}` }); })
    .catch(async (err) => {
        //console.error(err);
        await slashCommand.editReply({ content: `An error occured trying to change the Member Limit for your Temp Voice Channel...` });
    });

    return;
}





/**
* Handles the "/voice rename" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function renameTempVoice(slashCommand)
{
    // Check Command can be used
    if ( await canCommandBeUsed(slashCommand) === false ) { return; }

    // Bring in JSONs
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');

    // Grab VC
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === slashCommand.member.id);

    // Fetch input
    const InputNewName = slashCommand.options.getString("name", true);

    // Rename VC
    await slashCommand.deferReply();

    /** @type {VoiceChannel} */
    const FetchedVoiceChannel = await slashCommand.guild.channels.fetch(CheckExistingVC[0]["VOICE_CHANNEL_ID"]);
    await FetchedVoiceChannel.edit({ name: InputNewName })
    .then(async () => { await slashCommand.editReply({ content: `Renamed Temp Voice Channel to ${InputNewName}` }); })
    .catch(async (err) => {
        //console.error(err);
        await slashCommand.editReply({ content: `An error occured trying to rename your Temp Voice Channel...` });
    });

    return;
}





/**
* Handles the "/voice lock" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function lockTempVoice(slashCommand)
{
    // Check Command can be used
    if ( await canCommandBeUsed(slashCommand) === false ) { return; }

    // Bring in JSONs
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');

    // Grab VC
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === slashCommand.member.id);

    // Lock VC
    await slashCommand.deferReply();

    /** @type {VoiceChannel} */
    const FetchedVoiceChannel = await slashCommand.guild.channels.fetch(CheckExistingVC[0]["VOICE_CHANNEL_ID"]);
    await FetchedVoiceChannel.permissionOverwrites.edit(slashCommand.guildId, { Connect: false })
    .then(async () => { await slashCommand.editReply({ content: `Locked Temp Voice Channel!` }); })
    .catch(async (err) => {
        //console.error(err);
        await slashCommand.editReply({ content: `An error occured trying to lock your Temp Voice Channel...` });
    });

    return;
}





/**
* Handles the "/voice unlock" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function unlockTempVoice(slashCommand)
{
    // Check Command can be used
    if ( await canCommandBeUsed(slashCommand) === false ) { return; }

    // Bring in JSONs
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');

    // Grab VC
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === slashCommand.member.id);

    // Unlock VC
    await slashCommand.deferReply();

    /** @type {VoiceChannel} */
    const FetchedVoiceChannel = await slashCommand.guild.channels.fetch(CheckExistingVC[0]["VOICE_CHANNEL_ID"]);
    await FetchedVoiceChannel.permissionOverwrites.edit(slashCommand.guildId, { Connect: true })
    .then(async () => { await slashCommand.editReply({ content: `Unlocked Temp Voice Channel!` }); })
    .catch(async (err) => {
        //console.error(err);
        await slashCommand.editReply({ content: `An error occured trying to unlock your Temp Voice Channel...` });
    });

    return;
}





/**
* Handles the "/voice create" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function createTempVoice(slashCommand)
{
    // Fetch Member that used this Command, and Parent Category from JSON/Guild
    const VoiceCreator = slashCommand.member;
    const GuildId = slashCommand.guildId;
    const VoiceSettings = require('../../JsonFiles/hidden/guildSettings.json');
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const GuildSettings = VoiceSettings[`${GuildId}`];

    // Verify Settings have been set
    if ( !GuildSettings ) { return await slashCommand.reply({ ephemeral: true, content: `This Server hasn't setup the Temp VC System yet!` }); }
    // Verify User doesn't already have one active Temp VC created
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === VoiceCreator.id);
    if ( CheckExistingVC.length > 0 ) { return await slashCommand.reply({ ephemeral: true, content: `You cannot create a new Temp VC when you already have one created & active! ( <#${CheckExistingVC[0]['VOICE_CHANNEL_ID']}> )` }); }

    const ParentCategoryId = GuildSettings["PARENT_CATEGORY_ID"];
    /** @type {CategoryChannel} */
    const FetchedCategory = await slashCommand.guild.channels.fetch(ParentCategoryId);

    // Verify Bot has Permissions
    /** @type {PermissionsBitField} */
    const BotPermissions = FetchedCategory.permissionsFor(DiscordClient.user.id);
    if ( !BotPermissions.has(PermissionFlagsBits.ViewChannel) || !BotPermissions.has(PermissionFlagsBits.ManageChannels) )
    {
        return await slashCommand.reply({ ephemeral: true, content: `Sorry, but I cannot create a new Temp Voice Channel for you, since I am missing required Permissions for the **<#${ParentCategoryId}>** Category. Please ask this Server's Admins or Owner to fix this!

Permissions I require in **<#${ParentCategoryId}>** :
- \`View Channels\`
- \`Manage Channels\`` });
    }


    // Defer, then create Voice Channel!
    await slashCommand.deferReply({ ephemeral: true });

    await slashCommand.guild.channels.create({
        type: ChannelType.GuildVoice,
        parent: ParentCategoryId,
        name: `${VoiceCreator.user.username}`,
        reason: `${VoiceCreator.user.username}#${VoiceCreator.user.discriminator} created a new Temp VC`
    })
    .then(async (CreatedVoiceChannel) => {
        // Voice Channel created
        // Create Permission Overwrites for Channel Creator & Bot
        await CreatedVoiceChannel.permissionOverwrites.edit(VoiceCreator.id, { ViewChannel: true, Connect: true, ManageChannels: true });
        await CreatedVoiceChannel.permissionOverwrites.edit(DiscordClient.user.id, { ViewChannel: true, Connect: true, ManageChannels: true });

        // Save to JSON
        let newVoice = {
            "VOICE_CHANNEL_ID": CreatedVoiceChannel.id,
            "CHANNEL_OWNER_ID": VoiceCreator.id
        };
        ActiveTempVoices[CreatedVoiceChannel.id] = newVoice;
        fs.writeFile('./JsonFiles/hidden/activeTempVoices.json', JSON.stringify(ActiveTempVoices, null, 4), async (err) => {
            if ( err ) { return await slashCommand.editReply({ ephemeral: true, content: `Sorry, something went wrong while trying to create your Temp Voice Channel... Please try again later` }); }
        });

        // ACK Slash Command
        await slashCommand.editReply({ content: `Created your Temp Voice Channel! ( <#${CreatedVoiceChannel.id}> )\nYou can find it under this Server's Temp VC Category (I've also pinged you in it!)` });
        
        // Send a message in the VC (Thanks to TiV) containing a ping to help find it
        await CreatedVoiceChannel.send({ allowedMentions: { users: [VoiceCreator.id] }, content: `*Temp VC | Creator: <@${VoiceCreator.id}>*

Welcome to your personal Voice Channel!
It will be removed once every Member has left the Voice Channel. If you need help, use the </voice help:${slashCommand.commandId}> Command - and remember to follow this Server's Rules!\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬` });
    })
    .catch(async (err) => {
        //console.error(err);
        await slashCommand.editReply({ content: `Sorry, something went wrong while trying to create your Temp Voice Channel... Please try again in a moment.` });
    });

    return;
}
