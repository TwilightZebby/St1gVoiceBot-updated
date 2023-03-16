# St1gVoiceBot Update Concept
A concept update for Dr1fterX's St1gVoiceBot, since his is still on DJS v11 and he has a lot of St1gBots to update from v11 to v14 - so I'm being helpful I hope! :3

---

# Features

- Create a Temp Voice Channel by joining the specified Voice Channel
- Temp VC Owners can manage their own Temp VCs either through use of Slash Commands, or (providing they have Manage Channel Permission in their own VC) through Discord's native Channel Settings interface
- Temp VCs are automatically deleted once they no longer have any Members connected to them
- If enabled, a log for Temp VCs is sent to a specified Text Channel for Server Moderators/Admins/Owners to view

## Note about Temp VC Permissions
Upon creation, a Temp VC will by default inherit the Permissions of its parent Category; while adding extra Permission Overrides to allow the VC Owner (and this Bot) to connect & view the Temp VC.

---

# Commands
## Server Admin/Owner Commands
ℹ *These Commands, by default, require the "Manage Server" Permission in order to be viewable in the Slash Command Picker, and to be used. This can be overridden in Server Settings -> Integrations -> [This Bot] (Server Settings page is only viewable on Desktop/Web Discord currently).*

### `/config view`
> Shows the current settings for this Bot for this Server.

### `/config edit`
> Allows setting specific settings for this Bot for this Server. Options are explained using Discord's Slash Command Picker interface.

### `/config log`
> Allows enabling or disabling various Temp VC logs, should the Server have a Logging Channel set using the `/config edit` Command. Options are explained using Discord's Slash Command Picker interface.
> Please note that logging creation & deletion of Temp VCs cannot be disabled when a Logging Channel is set.

## Temp VC Owner-only Commands
### `/voice lock`
> Locks the Temp VC this is used in - preventing anyone (excluding VC Owner) from connecting to the Temp VC. (By disabling the `CONNECT` Permission for either atEveryone, or a Member Role if specified in the Bot's Settings)

### `/voice unlock`
> Unlocks the Temp VC this is used in - allowing anyone to connect to it again. (By enabling the `CONNECT` Permission for either atEveryone, or a Member Role if specified in the Bot's Settings)

### `/voice rename`
> Renames the Temp VC this is used in to whatever its Owner specifies.

### `/voice limit`
> Changes the limit of how many Members can connect to the Temp VC.
> Minimum: 0 (removes the limit), Maximum: 99.
> Defaults to no limit on Temp VC creation.

### `/voice permit`
> Permits the specified Member, allowing them to connect to the Temp VC even if its locked.
> Also allows the specified Member to view the Temp VC, if it is vanished.

### `/voice reject`
> Rejects the specified Member, revoking their Permissions to connect to the Temp VC (even if the VC is unlocked).
> Also hides the Temp VC from the Member, if it is vanished.
> Additionally, if the Member is currently connected to the Temp VC, they will be force-disconnected upon rejection.

### `/voice vanish`
> Vanishes the Temp VC, hiding it from everyone except the Temp VC's Owner. (By disabling the `VIEW_CHANNEL` Permission for either atEveryone, or a Member Role if specified in the Bot's Settings)

### `/voice unvanish`
> Unvanishes the Temp VC, revealing it and allowing everyone to see it again. (By enabling the `VIEW_CHANNEL` Permission for either atEveryone, or a Member Role if specified in the Bot's Settings)

### `/voice transfer`
> Transfers ownership of the Temp VC to the specified Member.
> This Command requires the specified Member to be currently connected to the Temp VC this was used in, in order for VC ownership to be transferred.
> After successful running of this Command, the previous VC Owner will no longer be seen as Owner of the Temp VC, and thus will no longer be able to use any of the VC Owner-only Commands.

## Commands everyone can use
### `/voice claim`
> Attempts to claim ownership of the Temp VC the Member is currently connected to.
> FAILS if the current VC Owner is still connected to the Temp VC, or if the Member running the Command is *not* connected to any Temp VCs.
> SUCCEEDS if the current VC Owner is *not* connected to the Temp VC in question, thus transferring VC Ownership to the Member running this Command.

---

# How to register the Slash Commands

1. Go into `./deployCommands.js` and uncomment the relevant line
2. Use `node deployCommands.js` in your command line/terminal

# How to UNregister (remove from Discord) the Slash Commands

1. Go to `./deployCommands.js` and uncomment the relevant line
2. Make sure you are unregistering the Command from the Scope it was previously registered to.
  - For instance: Trying to unregister it globally when it is registered to a specific Server will fail.
  - Do **NOT** add anything in the empty Array on in the `.set()` method. The empty Array is used as a shortcut for "unregister ALL Application Commands for this Bot".
3. Use `node deployCommands.js` in your command line/terminal

---

# Configuration File

- `ErrorLogChannelID` - Currently unused
- `ErrorLogGuildID` - Used in `./deployCommands.js` for (un)registering Slash Command to/from the specific Server
- `BotDevID` - Used in the Text Command Permissions System
