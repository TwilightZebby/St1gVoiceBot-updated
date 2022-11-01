const { VoiceChannel, EmbedBuilder, Colors, GuildMember, Guild, TextChannel } = require("discord.js");
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
        const ActiveTempVoices = require('../JsonFiles/hidden/activeTempVoices.json');
        const SearchableActiveTempVoices = Object.values(ActiveTempVoices);

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
