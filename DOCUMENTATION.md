# BPL documentation and usage

## Initial setup

Upon joining a server, the bot will sync channels and roles and create missing ones if needed.

You should add the Bot Moderator role to yourself and any other potential moderator so that the bot recognizes you for admin commands.

## Registering games and game modes

The first command that should be run is `/game add` to add one of the supported games to the server.

Once a game is added, you can use `/game mode add` to add a game mode to it.

After creating a game mode, you can use `/game mode sync` to sync the default game data for characters and terrains to that game mode.

> ℹ️ Game modes have a team count but no team size. Team size is managed in the draft sequence, so that in the future draft sequences can be reused for multiple game modes.

> ℹ️ Games and game modes are managed per server, so if your game is being updated often, you should periodically run the sync commands or add the new characters and terrains manually via their respective commands.

## Managing game data

For any given game mode, you can manage characters and terrains via the `/game character` and `/game terrain` suite of commands.

Characters can be enabled and disabled in draft through the `/game character enable` and `/game character disable` commands. You an also edit per-character restrictions with the `/game character edit` command.

Terrains use weights to determine the frequency at which they appear whenever terrain selection is random (no terrain draft in the sequence). You can edit the weight with the `/game terrain edit` command.

> ℹ️ A weight of 0 means the terrain can never roll.

## Managing draft sequences

After the game mode data is in order, you need to add a draft sequence to be able to draft. Run the `/draft sequence add` command with a valid sequence to create it and attach it to a game mode.

> ℹ️ The sequence is a list of space separated tokens. Example of a valid sequence sequence: GB B P P B P

> ⚠️ Draft sequences are managed separately from game modes for architectural flexibility and future proofing, but they are **mandatory** for match creation. A game mode without a draft sequence will not be queueable and matches will not start.

## Registering and managing profile

In order to create or join matches, you need to register a profile for the game(s) you wish to play. Running the `/register` command will open a dialog to input an in-game name and an optional description. Upon saving, your profile will be created. You can edit profiles at any time by using the `/profile edit` command.

To join a queue, you also need to enable regions for your profile. You can manage them through the `/profile region enable` and `/profile region disable` commands.

> ⚠️ Regions need to exist for a game before you can assigne them to profiles. To manage them, use the `/game region` suite of commands.

## Creating and joining matches

You can create a private match through the `/match create` command. This will output a lobby code that you can give to other players for them to use with the `/match join` command. Players can also leave at any time before the lobby is full with the `/match leave` command.

Bot Moderators can also force drop a match at any point with the `/match drop` command if the need arises.

> ℹ️ Matches are automatically dropped if everyone leaves the lobby.

## Creating and joining queues

Bot Moderators can create or enable a queue for a given game mode through the `/queue enable`. If a corresponding queue embed doesn't exist, it will be created in the queue channel. To disable a queue, use the `/queue disable` command.

Players can join or leave queues through the `/queue join` and `/queue leave` commands, or more simply by clicking the buttons on the queue embeds.

> ℹ️ When a queue can produce a valid match, it will be created without a lobby code and immediately put into the draft phase.

## Drafting

Whenever a match enters draft phase, a private draft channel is created for each team, player info embeds are generated depending on the draft sequence, and finally the match info UI is generated.

Player captains can then select either a player, a terrain, or a character to pick or ban depending on the draft step. A paginated list is displayed under the match info embed with navigation buttons; selecting a valid option in the list during a valid turn will advance the draft forward to the next step.

Whenever the last draft step is completed, the match is considered ongoing and players can report the match outcome.

At any point, if a majority of players agree, the match can be dropped by vote.

If your team captain is inactive, you can start a captain claim which will setup a 1-minute timer, after which you will be appointed as new captain of the team if the current captain hasn't made any draft actions.

## Reporting

After the draft phase, the match info UI is generated in the match history channel, with a paginated list of the teams present in the match and a drop button. Selecting a team in the list will cast a vote for that team indicating they have won. Clicking on the drop button will cast a vote to drop the match.

If a majority of players agree on a winning team or want to drop the match, the outcome will be selected and either the match is dropped, or finished with rating changes.

> ℹ️ Rating changes are computed on a per-team basis, with the classic Elo formula adjusted for n teams.
