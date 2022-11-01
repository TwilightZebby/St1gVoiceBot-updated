const { VoiceState, VoiceChannel } = require("discord.js");
const fs = require('fs');
const TempVCLoggingModule = require('./TempVCLoggingModule.js');
const LocalizedErrors = require("../JsonFiles/errorMessages.json");

module.exports = {
    /**
     * Checks if the Temp Voice Channel no longer has any Members connected to it
     * @param {VoiceState} oldState 
     * @returns {Boolean}
     */
    async isTempVoiceChannelEmpty(oldState)
    {
        // Grab Voice Channel
        /** @type {VoiceChannel} */
        const TempVoiceChannel = await oldState.guild.channels.fetch(oldState.channelId)
        .catch(err => {
            //console.error(err);
        });

        // Check for connected Members, if any
        if ( TempVoiceChannel.members.size > 0 ) { return false; }
        else { return true; }
    },



    /**
     * Handles deletion (and logging, if enabled on Guild) of Temp VC when every Member has disconnected from it
     * @param {VoiceState} oldState 
     */
    async deleteTempVoiceChannel(oldState)
    {
        // Bring in JSONs
        const ActiveTempVoices = require('../JsonFiles/hidden/activeTempVoices.json');
        // Grab Temp VC
        /** @type {VoiceChannel} */
        const TempVoiceChannel = await oldState.guild.channels.fetch(oldState.channelId)
        .catch(err => {
            //console.error(err);
        });

        // Announce deletion
        await TempVoiceChannel.send({ content: `⚠ Automatically deleting this Temp Voice Channel now that everyone has left it...` })
        .then(async () => {
            // Log deletion
            await TempVCLoggingModule.logDeletion(TempVoiceChannel, ActiveTempVoices[TempVoiceChannel.id]["CHANNEL_OWNER_ID"], ActiveTempVoices[TempVoiceChannel.id]["CHANNEL_CREATOR_ID"]);


            // Remove from Active Temp VCs JSON
            delete ActiveTempVoices[`${TempVoiceChannel.id}`];
            fs.writeFile('./JsonFiles/hidden/activeTempVoices.json', JSON.stringify(ActiveTempVoices, null, 4), async (err) => {
                if ( err )
                { 
                    //console.error(err);
                    return;
                }
            });

            // Delete Temp Voice Channel
            await TempVoiceChannel.delete()
            .catch(err => {
                //console.error(err);
            });
        })
        .catch(err => {
            //console.error(err);
        });

        return;
    }
}
