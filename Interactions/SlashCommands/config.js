const { ChatInputCommandInteraction, ChatInputApplicationCommandData, AutocompleteInteraction, ApplicationCommandType, PermissionFlagsBits, ApplicationCommandOptionType, ChannelType, Colors, EmbedBuilder, CategoryChannel, TextChannel } = require("discord.js");
const fs = require('fs');
const { DiscordClient, Collections } = require("../../constants.js");
const LocalizedErrors = require("../../JsonFiles/errorMessages.json");
const LocalizedStrings = require("../../JsonFiles/stringMessages.json");

module.exports = {
    // Command's Name
    //     Use full lowercase
    Name: "config",

    // Command's Description
    Description: `View or Configure the settings for this Bot`,

    // Command's Category
    Category: "GENERAL",

    // Cooldown, in seconds
    //     Defaults to 3 seconds if missing
    Cooldown: 30,

    // Cooldowns for specific subcommands and/or subcommand-groups
    //     IF SUBCOMMAND: name as "subcommandName"
    //     IF SUBCOMMAND GROUP: name as "subcommandGroupName_subcommandName"
    SubcommandCooldown: {
        "edit": 30,
        "view": 20
    },

    // Scope of Command's usage
    //     One of the following: DM, GUILD, ALL
    Scope: "GUILD",
    
    // Scope of specific Subcommands Usage
    //     One of the following: DM, GUILD, ALL
    //     IF SUBCOMMAND: name as "subcommandName"
    //     IF SUBCOMMAND GROUP: name as "subcommandGroupName_subcommandName"
    SubcommandScope: {
        "edit": "GUILD",
        "view": "GUILD"
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
        Data.defaultMemberPermissions = PermissionFlagsBits.ManageGuild;
        Data.options = [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "view",
                description: "View your current settings for this Bot"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "edit",
                description: "Edit the settings for this Bot",
                options: [
                    {
                        type: ApplicationCommandOptionType.Channel,
                        name: "parent-category",
                        description: "The Parent Category all Temp VCs will be made in",
                        channel_types: [ ChannelType.GuildCategory ],
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.Channel,
                        name: "log-channel",
                        description: "The Text Channel to log Temp VC Activity & Chats in",
                        channel_types: [ ChannelType.GuildText ],
                        required: false
                    }
                ]
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
            case "view":
                return await viewSettings(slashCommand);

            case "edit":
                return await editSettings(slashCommand);
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
* Handles the "/config view" Subcommand
* @param {ChatInputCommandInteraction} slashCommand 
*/
async function viewSettings(slashCommand)
{
    // Grab Guild ID and refetch JSON
    const GuildId = slashCommand.guildId;
    const VoiceSettings = require('../../JsonFiles/hidden/guildSettings.json');
    const GuildSettings = VoiceSettings[`${GuildId}`];

    // No Settings found for Guild
    if ( !GuildSettings ) { return await slashCommand.reply({ ephemeral: true, content: `The Temp VC System hasn't been set up for this Server yet!
Please use the </config edit:${slashCommand.commandId}> Slash Command to set up the Temp VC System.` }); }

    // Settings are found for Guild, construct into Embed and display
    const SettingsEmbed = new EmbedBuilder().setColor(Colors.Aqua).setTitle(`Temp VC Settings for ${slashCommand.guild.name}`)
    .setDescription(`*Use </config edit:${slashCommand.commandId}> to edit them*`)
    .addFields(
        { name: `Parent Category`, value: GuildSettings["PARENT_CATEGORY_ID"] == null ? `*Not set*` : `<#${GuildSettings["PARENT_CATEGORY_ID"]}>` }
    );

    return await slashCommand.reply({ ephemeral: true, embeds: [SettingsEmbed] });
}
 


/**
 * Handles the "/config edit" Subcommand
 * @param {ChatInputCommandInteraction} slashCommand 
 */
async function editSettings(slashCommand)
{
    // Grab values and data
    const GuildId = slashCommand.guildId;
    const VoiceSettings = require('../../JsonFiles/hidden/guildSettings.json');
    /** @type {CategoryChannel} */
    const InputCategory = slashCommand.options.getChannel("parent-category");
    /** @type {TextChannel} */
    const InputLogChannel = slashCommand.options.getChannel("log-channel");
    
    const GuildSettings = VoiceSettings[`${GuildId}`];
    let newSettings = { "PARENT_CATEGORY_ID": null, "LOG_CHANNEL_ID": null };

    // Ensure something was given
    if ( InputCategory == null && InputLogChannel == null ) { return await slashCommand.reply({ ephemeral: true, content: `You didn't set any new Setting values! Please try using this Command again, ensuring at least one value is set.` }); }

    // Grab current values if there are any
    if ( GuildSettings ) { newSettings = GuildSettings };
    let updatedSettingsString = ``;
    
    
    // Category ID
    if ( InputCategory != null )
    {
        // Ensure Bot has Permissions to Manage Channels in that Category
        /** @type {PermissionsBitField} */
        const BotPermissions = InputCategory.permissionsFor(DiscordClient.user.id);
        if ( !BotPermissions.has(PermissionFlagsBits.ViewChannel) || !BotPermissions.has(PermissionFlagsBits.ManageChannels) )
        {
            return await slashCommand.reply({ ephemeral: true, content: `Sorry, but I cannot assign the **<#${InputCategory.id}>** Category as the Temp VC Category since I do not have either the "View Channel" and/or the "Manage Channels" Permissions for that Category.` });
        }

        newSettings["PARENT_CATEGORY_ID"] = InputCategory == null ? null : InputCategory.id;
        updatedSettingsString += `- Set Parent Category: <#${InputCategory.id}>`;
    }



    // Logging Channel ID
    if ( InputLogChannel != null )
    {
        // Ensure Bot has Permissions to Send Messages & Attach Files in that Channel
        /** @type {PermissionsBitField} */
        const BotPermissions = InputLogChannel.permissionsFor(DiscordClient.user.id);
        if ( !BotPermissions.has(PermissionFlagsBits.ViewChannel) || !BotPermissions.has(PermissionFlagsBits.SendMessages) || !BotPermissions.has(PermissionFlagsBits.AttachFiles) )
        {
            return await slashCommand.reply({ ephemeral: true, content: `Sorry, but I cannot assign the **<#${InputLogChannel.id}>** Channel as the Logging Channel, since I do not have either the "View Channel", "Send Messages", and/or the "Attach Files" Permissions for that Channel.` });
        }

        newSettings["LOG_CHANNEL_ID"] = InputLogChannel == null ? null : InputLogChannel.id;
        updatedSettingsString += `${updatedSettingsString.length > 1 ? `\n` : ""}- Set Logging Channel: <#${InputLogChannel.id}>`;
    }

    

    // Update saved Settings
    VoiceSettings[`${GuildId}`] = newSettings;
    fs.writeFile('./JsonFiles/hidden/guildSettings.json', JSON.stringify(VoiceSettings, null, 4), async (err) => {
        if ( err ) { return await slashCommand.reply({ ephemeral: true, content: `Sorry, something went wrong while trying to save your updated Temp VC Setting(s)... Please try again later` }); }
    });

    // Respond to User
    return await slashCommand.reply({ ephemeral: true, content: `✅ Successfully updated your Temp VC Settings!\n\n${updatedSettingsString}` });
}
