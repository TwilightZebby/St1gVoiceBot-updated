const { ChatInputCommandInteraction, ChatInputApplicationCommandData, AutocompleteInteraction, ApplicationCommandType, ApplicationCommandOptionType, CategoryChannel, PermissionFlagsBits, PermissionsBitField, ChannelType } = require("discord.js");
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
    Cooldown: 10,

    // Cooldowns for specific subcommands and/or subcommand-groups
    //     IF SUBCOMMAND: name as "subcommandName"
    //     IF SUBCOMMAND GROUP: name as "subcommandGroupName_subcommandName"
    SubcommandCooldown: {
        "create": 60
    },

    // Scope of Command's usage
    //     One of the following: DM, GUILD, ALL
    Scope: "GUILD",
    
    // Scope of specific Subcommands Usage
    //     One of the following: DM, GUILD, ALL
    //     IF SUBCOMMAND: name as "subcommandName"
    //     IF SUBCOMMAND GROUP: name as "subcommandGroupName_subcommandName"
    SubcommandScope: {
        "create": "GUILD"
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

            /* case "placeholder":
                return await placeholder(slashCommand); */
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
* Handles the "/voice create" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function createTempVoice(slashCommand)
{
    // Fetch Member that used this Command, and Parent Category from JSON/Guild
    const VoiceCreator = slashCommand.member;
    const GuildId = slashCommand.guildId;
    const VoiceSettings = require('../../JsonFiles/hidden/guildSettings.json');
    const GuildSettings = VoiceSettings[`${GuildId}`];

    // Verify Settings have been set
    if ( !GuildSettings ) { return await slashCommand.reply({ ephemeral: true, content: `This Server hasn't setup the Temp VC System yet!` }); }

    const ParentCategoryId = GuildSettings["PARENT_CATEGORY_ID"];
    /** @type {CategoryChannel} */
    const FetchedCategory = await slashCommand.guild.channels.fetch(ParentCategoryId);

    // Verify Bot has Permissions
    /** @type {PermissionsBitField} */
    const BotPermissions = FetchedCategory.permissionsFor(DiscordClient.user.id);
    if ( !BotPermissions.has(PermissionFlagsBits.ViewChannel) || !BotPermissions.has(PermissionFlagsBits.ManageChannels) || !BotPermissions.has(PermissionFlagsBits.ManageRoles) )
    {
        return await slashCommand.reply({ ephemeral: true, content: `Sorry, but I cannot create a new Temp Voice Channel for you, since I am missing required Permissions for the **<#${ParentCategoryId}>** Category. Please ask this Server's Admins or Owner to fix this!

Permissions I require in **<#${ParentCategoryId}>** :
- \`View Channels\`
- \`Manage Channels\`
- \`Manage Permissions\`` });
    }


    // Defer, then create Voice Channel!
    await slashCommand.deferReply({ ephemeral: true });

    await slashCommand.guild.channels.create({
        type: ChannelType.GuildVoice,
        parent: ParentCategoryId,
        name: `${VoiceCreator.user.username}`,
        permissionOverwrites: [{ id: VoiceCreator.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect] }],
        reason: `${VoiceCreator.user.username}#${VoiceCreator.user.discriminator} created a new Temp VC`
    })
    .then(async (CreatedVoiceChannel) => {
        // Voice Channel created
        // ACK Slash Command first
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
