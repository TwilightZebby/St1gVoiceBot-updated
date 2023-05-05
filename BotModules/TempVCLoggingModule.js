const { VoiceChannel, EmbedBuilder, Colors, GuildMember, Guild, TextChannel, VoiceState, AttachmentBuilder, Collection, Message } = require("discord.js");
const fs = require('fs');

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
            { name: `Channel Creator`, value: `**Tag:** ${creatorMember.user.tag}\n**Mention:** <@${creatorMember.id}>\n**ID:** *${creatorMember.id}*` }
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
            { name: `Channel's Last Owner`, value: `**Tag:** ${ChannelOwnerMember.user.tag}\n**Mention:** <@${ChannelOwnerMember.id}>\n**ID:** *${ChannelOwnerMember.id}*` },
            { name: `Channel's Creator`, value: `**Tag:** ${ChannelCreatorMember.user.tag}\n**Mention:** <@${ChannelCreatorMember.id}>\n**ID:** *${ChannelCreatorMember.id}*` }
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

        // Check Logging is enabled on this Server
        if ( hasLoggingEnabled(voiceChannel.guildId, "TEXT_CHAT") == false ) { return; }

        // Grab Log Channel's ID
        const LogChannelId = VoiceSettings[voiceChannel.guildId]["LOG_CHANNEL_ID"];
        
        // Fetch all the Messages sent in the Temp VC, looping if need be because of Discord's 100-max restriction on their "bulk GET messages" endpoint
        let fetchedMessagesCollection = await voiceChannel.messages.fetch({ limit: 100, cache: false });
        if ( fetchedMessagesCollection.size === 100 )
        {
            let doLoop = false;
            let lastFetchedMessageId = fetchedMessagesCollection.last().id;
            do {
                let tempCollection = await voiceChannel.messages.fetch({ before: lastFetchedMessageId, limit: 100, cache: false });
                fetchedMessagesCollection = fetchedMessagesCollection.concat(tempCollection);
                if ( tempCollection.size === 100 )
                {
                    doLoop = true;
                    lastFetchedMessageId = tempCollection.last().id;
                    continue;
                }
                else
                {
                    doLoop = false;
                    lastFetchedMessageId = null;
                    break;
                }
            } while (doLoop)
        }

        // Reverse order of Messages so newest is at the bottom
        //fetchedMessagesCollection = fetchedMessagesCollection.reverse();

        let cleanMessagesArray = [];

        // Clean up objects for JSON reasons
        fetchedMessagesCollection.forEach(message => {
            // Just to also tidy up extra message stuff
            let messageAttachments = [];
            let messageStickers = [];
            let channelMentions = [];
            let memberMentions = [];
            let userMentions = [];
            let roleMentions = [];
            let repliedUser = null;
            
            if ( message.attachments.size > 0 )
            {
                message.attachments.forEach(attachment => {
                    let newAttachmentObject = {
                        url: attachment.url,
                        proxyURL: attachment.proxyURL,
                        name: attachment.name,
                        contentType: attachment.contentType,
                        description: attachment.description
                    };

                    messageAttachments.push(newAttachmentObject);
                });
            }

            if ( message.stickers.size > 0 )
            {
                message.stickers.forEach(sticker => {
                    let newStickerObject = {
                        name: sticker.name,
                        description: sticker.description,
                        guildId: sticker.guildId
                    };

                    messageStickers.push(newStickerObject);
                });
            }

            if ( message.mentions.channels.size > 0 )
            {
                message.mentions.channels.forEach(channel => {
                    let newChannelObject = {
                        id: channel.id,
                        type: channel.type,
                        name: channel.name
                    };

                    channelMentions.push(newChannelObject);
                });
            }

            if ( message.mentions.users.size > 0 )
            {
                message.mentions.users.forEach(user => {
                    let newUserObject = {
                        id: user.id,
                        tag: `${user.tag}`,
                        isBot: user.bot
                    };

                    userMentions.push(newUserObject);
                });
            }

            if ( message.mentions.members.size > 0 )
            {
                message.mentions.members.forEach(member => {
                    let newMemberObject = {
                        id: member.id,
                        tag: `${member.user.tag}`,
                        nickname: member.nickname,
                        isBot: member.user.bot
                    };

                    memberMentions.push(newMemberObject);
                });
            }

            if ( message.mentions.roles.size > 0 )
            {
                message.mentions.roles.forEach(role => {
                    let newRoleObject = {
                       id: role.id,
                       name: role.name
                    };

                    roleMentions.push(newRoleObject);
                });
            }

            if ( message.mentions.repliedUser != null )
            {
                repliedUser = {
                    id: message.mentions.repliedUser.id,
                    tag: `${message.mentions.repliedUser.tag}`,
                    isBot: message.mentions.repliedUser.bot
                };
            }


            let newMessageObject = {
                id: message.id,
                createdTimestamp: message.createdTimestamp,
                system: message.system,
                authorId: message.author.id,
                authorTag: `${message.author.tag}`,
                authorNickname: message.member.nickname,
                content: message.content,
                cleanContent: message.cleanContent,
                mentions: {
                    everyone: message.mentions.everyone,
                    users: userMentions,
                    members: memberMentions,
                    roles: roleMentions,
                    channels: channelMentions,
                    repliedUser: repliedUser
                },
                reference: message.reference,
                embeds: message.embeds,
                attachments: messageAttachments,
                stickers: messageStickers,
                components: message.components
            };

            cleanMessagesArray.push(newMessageObject);
        });


        // Create JSON file for Messages
        fs.writeFile(`./JsonFiles/chatTranscriptsTemp/${voiceChannel.id}_transcript.txt`, JSON.stringify(cleanMessagesArray, null, 3), (err) => {
            if ( err )
            {
                //console.error(err);
                return;
            }
        });

        // Create Discord Attachment for transcript
        const ChatTranscriptAttachment = new AttachmentBuilder().setFile(`./JsonFiles/chatTranscriptsTemp/${voiceChannel.id}_transcript.txt`).setName(`${voiceChannel.id}_transcript.txt`);
        
        // Send Transcript
        const LogChannel = await fetchLogChannel(voiceChannel.guild, LogChannelId);
        if ( LogChannel == null )
        { 
            delete ChatTranscriptAttachment, fetchedMessagesCollection, cleanMessagesArray;
            fs.unlink(`./JsonFiles/chatTranscriptsTemp/${voiceChannel.id}_transcript.txt`, (err) => {
                if ( err )
                {
                    //console.error(err);
                    return;
                }
            });
            return;
        }
        else
        {
            // Send Limit Change Log
            await LogChannel.send({ files: [ChatTranscriptAttachment] })
            .catch(err => {
                //console.error(err);
            });

            delete ChatTranscriptAttachment, fetchedMessagesCollection, cleanMessagesArray;
            fs.unlink(`./JsonFiles/chatTranscriptsTemp/${voiceChannel.id}_transcript.txt`, (err) => {
                if ( err )
                {
                    //console.error(err);
                    return;
                }
            });
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
            { name: `Previous Owner`, value: `**Tag:** ${previousOwner.user.tag}\n**Mention:** <@${previousOwner.id}>\n**ID:** *${previousOwner.id}*` },
            { name: `New Owner`, value: `**Tag:** ${newOwner.user.tag}\n**Mention:** <@${newOwner.id}>\n**ID:** *${newOwner.id}*` }
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
            { name: `Member Rejected`, value: `**Tag:** ${memberRejected.user.tag}\n**Mention:** <@${memberRejected.id}>\n**ID:** *${memberRejected.id}*` },
            { name: `Rejected By`, value: `**Tag:** ${channelOwner.user.tag}\n**Mention:** <@${channelOwner.id}>\n**ID:** *${channelOwner.id}*` }
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
            { name: `Member Permitted`, value: `**Tag:** ${memberPermitted.user.tag}\n**Mention:** <@${memberPermitted.id}>\n**ID:** *${memberPermitted.id}*` },
            { name: `Permitted By`, value: `**Tag:** ${channelOwner.user.tag}\n**Mention:** <@${channelOwner.id}>\n**ID:** *${channelOwner.id}*` }
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
