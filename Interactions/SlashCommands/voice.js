const { ChatInputCommandInteraction, ChatInputApplicationCommandData, AutocompleteInteraction, ApplicationCommandType, ApplicationCommandOptionType, CategoryChannel, PermissionFlagsBits, PermissionsBitField, ChannelType, VoiceChannel } = require("discord.js");
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
        "unlock": 30
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
        "unlock": "GUILD"
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
                name: "unlock",
                description: "Unlocks your Temp Voice Channel so anyone can join it"
            }
        ]

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

            case "unlock":
                return await unlockTempVoice(slashCommand);
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
* Handles the "/voice unlock" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function unlockTempVoice(slashCommand)
{
    // Bring in JSONs
    const VoiceSettings = require('../../JsonFiles/hidden/guildSettings.json');
    const ActiveTempVoices = require('../../JsonFiles/hidden/activeTempVoices.json');

    // Verify Command User does own an active Temp VC
    const SearchableActiveTempVoices = Object.values(ActiveTempVoices);
    const CheckExistingVC = SearchableActiveTempVoices.filter(item => item['CHANNEL_OWNER_ID'] === slashCommand.member.id);
    if ( CheckExistingVC.length < 1 || !CheckExistingVC.length || !CheckExistingVC ) { return await slashCommand.reply({ ephemeral: true, content: `You can only use this Command if you own a Temp Voice Channel!` }); }

    // Ensure Command was used in a Temp VC
    if ( slashCommand.channel.parentId !== VoiceSettings[slashCommand.guildId]["PARENT_CATEGORY_ID"] ) { return await slashCommand.reply({ ephemeral: true, content: `This Command cannot be used outside of Temp VCs!\nPlease go into the [Text Chat](<https://support.discord.com/hc/en-us/articles/4412085582359-Text-Channels-Text-Chat-In-Voice-Channels#h_01FMJT3SP072ZFJCZWR0EW6CJ1>) of your Voice Channel in order to use this Command.` }); }

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
It will be removed once every Member has left the Voice Channel. If you need help, use the </voice help:${slashCommand.commandId}> Command - and remember to follow this Server's Rules!` });
    })
    .catch(async (err) => {
        //console.error(err);
        await slashCommand.editReply({ content: `Sorry, something went wrong while trying to create your Temp Voice Channel... Please try again in a moment.` });
    });

    return;
}
