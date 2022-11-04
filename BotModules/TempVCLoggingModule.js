const { VoiceChannel, EmbedBuilder, Colors, GuildMember, Guild, TextChannel, VoiceState } = require("discord.js");
const fs = require('fs');
const LocalizedErrors = require("../JsonFiles/errorMessages.json");

module.exports = {
    /**
     * Logs creation of a Temp VC
     * @param {VoiceChannel} voiceChannel 
     * @param {GuildMember} creatorMember
     */
    async logCreation(voiceChannel, creatorMember)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId) == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Create embed
        const CreatedEmbed = new EmbedBuilder().setColor(Colors.Aqua)
        .setTitle("Temp VC Created")
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` },
            { name: `Channel Creator`, value: `**Tag:** ${creatorMember.user.username}#${creatorMember.user.discriminator}\n**Mention:** <@${creatorMember.id}>\n**ID:** *${creatorMember.id}*` }
        )
        .setTimestamp(voiceChannel.createdAt);

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete CreatedEmbed;
            return;
        }
        else
        {
            // Send Creation Log
            await LogChannel.send({ embeds: [CreatedEmbed] });
            return;
        }
    },




    /**
     * Logs deletion of a Temp VC
     * @param {VoiceChannel} voiceChannel 
     * @param {String} channelOwnerId
     * @param {String} channelCreatorId
     */
    async logDeletion(voiceChannel, channelOwnerId, channelCreatorId)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId) == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];
        // Grab Member Object for current Channel Owner & Channel Creator
        const ChannelOwnerMember = await voiceChannel.guild.members.fetch(channelOwnerId);
        const ChannelCreatorMember = await voiceChannel.guild.members.fetch(channelCreatorId);

        // Create embed
        const DeletionEmbed = new EmbedBuilder().setColor(Colors.NotQuiteBlack)
        .setTitle("Temp VC Deleted")
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**ID:** *${voiceChannel.id}*` },
            { name: `Channel's Last Owner`, value: `**Tag:** ${ChannelOwnerMember.user.username}#${ChannelOwnerMember.user.discriminator}\n**Mention:** <@${ChannelOwnerMember.id}>\n**ID:** *${ChannelOwnerMember.id}*` },
            { name: `Channel's Creator`, value: `**Tag:** ${ChannelCreatorMember.user.username}#${ChannelCreatorMember.user.discriminator}\n**Mention:** <@${ChannelCreatorMember.id}>\n**ID:** *${ChannelCreatorMember.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete DeletionEmbed;
            return;
        }
        else
        {
            // Send Creation Log
            await LogChannel.send({ embeds: [DeletionEmbed] });
            return;
        }
    },
    
    



    /**
     * Logs when ownership of a Temp VC has been transferred
     * @param {String} voiceChannelId
     * @param {String} guildId
     * @param {GuildMember} previousOwner
     * @param {GuildMember} newOwner
     */
    async logOwnershipTransfer(voiceChannelId, guildId, previousOwner, newOwner)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(guildId, "OWNER_STATUS") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const OwnershipEmbed = new EmbedBuilder().setColor(Colors.LuminousVividPink)
        .setTitle(`Temp VC Ownership Transferred`)
        .addFields(
            { name: `Voice Channel`, value: `\n**Mention:** <#${voiceChannelId}>\n**ID:** *${voiceChannelId}*` },
            { name: `Previous Owner`, value: `**Tag:** ${previousOwner.user.username}#${previousOwner.user.discriminator}\n**Mention:** <@${previousOwner.id}>\n**ID:** *${previousOwner.id}*` },
            { name: `New Owner`, value: `**Tag:** ${newOwner.user.username}#${newOwner.user.discriminator}\n**Mention:** <@${newOwner.id}>\n**ID:** *${newOwner.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(previousOwner.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete OwnershipEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [OwnershipEmbed] });
            return;
        }
    },



    /**
     * Logs when ownership of a Temp VC has been claimed
     * @param {VoiceChannel} voiceChannel
     * @param {String} previousOwnerId
     * @param {GuildMember} newOwner
     */
    async logOwnershipClaim(voiceChannel, previousOwnerId, newOwner)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "OWNER_STATUS") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const OwnershipEmbed = new EmbedBuilder().setColor(Colors.LuminousVividPink)
        .setTitle(`Temp VC Ownership Claimed`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` },
            { name: `Previous Owner`, value: `**Mention:** <@${previousOwnerId}>\n**ID:** *${previousOwnerId}*` },
            { name: `New Owner`, value: `**Mention:** <@${newOwner.id}>\n**ID:** *${newOwner.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete OwnershipEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [OwnershipEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Temp VC is locked
     * @param {VoiceChannel} voiceChannel
     */
    async logLock(voiceChannel)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "LOCK_STATUS") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const LockEmbed = new EmbedBuilder().setColor(Colors.DarkRed)
        .setTitle(`Temp VC Locked`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete LockEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [LockEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Temp VC is unlocked
     * @param {VoiceChannel} voiceChannel
     */
    async logUnlock(voiceChannel)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "LOCK_STATUS") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const UnlockEmbed = new EmbedBuilder().setColor(Colors.Gold)
        .setTitle(`Temp VC Unlocked`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete UnlockEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [UnlockEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Temp VC is unvanished
     * @param {VoiceChannel} voiceChannel
     */
    async logUnvanish(voiceChannel)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "VANISH_STATUS") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const UnvanishEmbed = new EmbedBuilder().setColor(Colors.Gold)
        .setTitle(`Temp VC Unvanished`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete UnvanishEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [UnvanishEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Temp VC is vanished
     * @param {VoiceChannel} voiceChannel
     */
    async logVanish(voiceChannel)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "VANISH_STATUS") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const VanishEmbed = new EmbedBuilder().setColor(Colors.DarkRed)
        .setTitle(`Temp VC Vanished`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete VanishEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [VanishEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Member gets rejected from a Temp VC by its Owner
     * @param {VoiceChannel} voiceChannel
     * @param {GuildMember} channelOwner
     * @param {GuildMember} memberRejected 
     */
    async logMemberReject(voiceChannel, channelOwner, memberRejected)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "PERMIT_REJECT") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const PermitEmbed = new EmbedBuilder().setColor(Colors.DarkRed)
        .setTitle(`Temp VC Member Rejected`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` },
            { name: `Member Rejected`, value: `**Tag:** ${memberRejected.user.username}#${memberRejected.user.discriminator}\n**Mention:** <@${memberRejected.id}>\n**ID:** *${memberRejected.id}*` },
            { name: `Rejected By`, value: `**Tag:** ${channelOwner.user.username}#${channelOwner.user.discriminator}\n**Mention:** <@${channelOwner.id}>\n**ID:** *${channelOwner.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete PermitEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [PermitEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Member gets permitted into a Temp VC by its Owner
     * @param {VoiceChannel} voiceChannel
     * @param {GuildMember} channelOwner
     * @param {GuildMember} memberPermitted 
     */
    async logMemberPermit(voiceChannel, channelOwner, memberPermitted)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "PERMIT_REJECT") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const PermitEmbed = new EmbedBuilder().setColor(Colors.Gold)
        .setTitle(`Temp VC Member Permitted`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` },
            { name: `Member Permitted`, value: `**Tag:** ${memberPermitted.user.username}#${memberPermitted.user.discriminator}\n**Mention:** <@${memberPermitted.id}>\n**ID:** *${memberPermitted.id}*` },
            { name: `Permitted By`, value: `**Tag:** ${channelOwner.user.username}#${channelOwner.user.discriminator}\n**Mention:** <@${channelOwner.id}>\n**ID:** *${channelOwner.id}*` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete PermitEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [PermitEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Temp VC has had its Member Limit changed
     * @param {VoiceChannel} voiceChannel
     * @param {Number} oldLimit
     * @param {Number} newLimit 
     */
    async logLimit(voiceChannel, oldLimit, newLimit)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "LIMIT") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const LimitEmbed = new EmbedBuilder().setColor(Colors.Gold)
        .setTitle(`Temp VC Member Limit Changed`)
        .addFields(
            { name: `Voice Channel`, value: `**Name:** ${voiceChannel.name}\n**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` },
            { name: `Old Limit`, value: `${oldLimit}` },
            { name: `New Limit`, value: `${newLimit}` }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete LimitEmbed;
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ embeds: [LimitEmbed] });
            return;
        }
    },
    



    /**
     * Logs when a Temp VC has been renamed
     * @param {VoiceChannel} voiceChannel
     * @param {String} oldName
     * @param {String} newName 
     */
    async logRename(voiceChannel, oldName, newName)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "RENAME") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Construct Embed
        const RenameEmbed = new EmbedBuilder().setColor(Colors.Gold)
        .setTitle(`Temp VC Renamed`)
        .addFields(
            { name: `Voice Channel`, value: `**Mention:** <#${voiceChannel.id}>\n**ID:** *${voiceChannel.id}*` },
            { name: `Old Name`, value: oldName },
            { name: `New Name`, value: newName }
        )
        .setTimestamp(Date.now());

        // Grab Log Channel
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete RenameEmbed;
            return;
        }
        else
        {
            // Send Rename Log
            await LogChannel.send({ embeds: [RenameEmbed] });
            return;
        }
    },
    



    /**
     * Logs a transcript of the Temp VC's Text Chat
     * @param {VoiceChannel} voiceChannel 
     */
    async logChatTranscript(voiceChannel)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "TEXT_CHAT") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];

        // Fetch all messages in Channel, and transcribe them into a JSON file to be sent
        // TODO: This
    },
    



    /**
     * Logs when a Member has joined a Temp VC
     * @param {VoiceState} voiceState 
     */
    async logMemberConnect(voiceState)
    {
        // Send Message in Temp VC's TC
        await voiceState.channel.send({ allowedMentions: { parse: [] }, content: `🟢 ***${voiceState.member.displayName}** joined this Voice Channel.*` });
        return;
    },
    



    /**
     * Logs when a Member has left a Temp VC
     * @param {VoiceState} voiceState 
     */
    async logMemberDisconnect(voiceState)
    {
        // Send Message in Temp VC's TC
        await voiceState.channel.send({ allowedMentions: { parse: [] }, content: `🔴 ***${voiceState.member.displayName}** left this Voice Channel.*` });
        return;
    }
}








/**
 * Fetches the Logging Channel in the Guild
 * @param {Guild} guild
 * @param {String} logChannelId 
 * @returns {TextChannel|null}
 */
async function fetchLogChannel(guild, logChannelId)
{
    return await guild.channels.fetch(logChannelId)
    .catch(err => {
        //console.error(err);
        return null;
    });
}








/**
 * Checks if the Guild has logging enabled (that is, has a Log Channel set)
 * @param {String} guildId 
 * @param {String} [logType]
 * @returns {Boolean}
 */
function hasLoggingEnabled(guildId, logType)
{
    // Grab JSON
    const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

    if ( !logType )
    {
        if ( VoiceSettings[guildId]["LOG_CHANNEL_ID"] == null ) { return false; }
        else { return true; }
    }
    else
    {
        if ( VoiceSettings[guildId]["LOG_CHANNEL_ID"] == null || VoiceSettings[guildId]["LOGGING"][logType] === false ) { return false; }
        else { return true; }
    }
}
