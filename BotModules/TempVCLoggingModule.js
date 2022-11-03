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
            { name: `Voice Channel`, value: `${voiceChannel.name}\n<#${voiceChannel.id}>\n*${voiceChannel.id}*` },
            { name: `Channel Creator`, value: `${creatorMember.user.username}#${creatorMember.user.discriminator}\n<@${creatorMember.id}>\n*${creatorMember.id}*` }
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
        const DeletionEmbed = new EmbedBuilder().setColor(Colors.Red)
        .setTitle("Temp VC Deleted")
        .addFields(
            { name: `Voice Channel`, value: `${voiceChannel.name}\n<#${voiceChannel.id}>\n*${voiceChannel.id}*` },
            { name: `Channel Owner`, value: `${ChannelOwnerMember.user.username}#${ChannelOwnerMember.user.discriminator}\n<@${ChannelOwnerMember.id}>\n*${ChannelOwnerMember.id}*` },
            { name: `Channel Creator`, value: `${ChannelCreatorMember.user.username}#${ChannelCreatorMember.user.discriminator}\n<@${ChannelCreatorMember.id}>\n*${ChannelCreatorMember.id}*` }
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
     * Logs a transcript of the Temp VC's Text Chat
     * @param {VoiceChannel} voiceChannel 
     */
    async logChatTranscript(voiceChannel)
    {
        // Grab JSONs
        const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

        // Check we can log
        if ( VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"] == null || VoiceSettings[voiceChannel.guildId]["LOGGING"]["TEXT_CHAT"] === false )
        { return; }

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
 * @returns {Boolean}
 */
function hasLoggingEnabled(guildId)
{
    // Grab JSON
    const VoiceSettings = require('../JsonFiles/hidden/guildSettings.json');

    if ( VoiceSettings[guildId]["LOG_CHANNEL_ID"] == null ) { return false; }
    else { return true; }
}
