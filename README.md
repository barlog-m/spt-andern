# Andern mod for SPT-AKI

[![GitHub Tags](https://img.shields.io/github/v/tag/barlog-m/SPT-AKI-Andern?color=0298c3&label=version&style=flat-square)](https://github.com/barlog-m/SPT-AKI-Andern/tags)
[![MIT License](https://img.shields.io/badge/license-MIT-0298c3.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Andern** is a mod for [SPT-AKI](https://www.sp-tarkov.com/)

Idea of this mod is to rebalance the game for better single player experience.

-   Gives PMC bots decent weapon from handmade presets.

-   Gives PMC good gear. Every PMC wear armor, helmet, rig, headphones, face cover and glasses.

-   Generates PMC with levels in configurable range.

-   Add trader that sell you couple weapon modules to make weapon until level 15 a bit less crap. And sells you keys for quests witch hard to find because of high randomness of loot in the game.

-   Mod allows to change Flea Market access level. Config parameter `FleaMinUserLevel`. You can increase it to level 42 to add more sense to looting because with Flea you can easy just buy everything your need for craft and hideout update.

Weapon and gear split by tiers. Tiers is described in `preset_name/preset.json` file.

You can disable PMC bot level generator with option `PmcLevel`.

You can disable PMC weapon generator with option `PmcWeapon`.

You can disable PMC bot gear generator with option `PmcGear`. Then mod only generate weapon.

Bots get random weapon from presets. Also, bots use specified ammo for each caliber from presets.

Preset made in the game and then exported with [SPT-AKI Profile Editor](https://hub.sp-tarkov.com/files/file/184-spt-aki-profile-editor/)

You can make your own preset. Just be sure that `ammo.json` contain record for weapon caliber.

Tactical device is not obligatory anymore.

Mod support any weapon: shotguns, pistols, revolvers, grenade launchers etc.

At night raids tactical device replaced to infrared one.

At night raids all PMC wear helmets with night vision googles.

PMC wears gear from gear.json for their level.

## PMC Bots Level configuration

Player level - `PmcBotLevelDownDelta`. Player level + `PmcBotLevelUpDelta`

if `UseFixedPmcBotLevelRange` true then pmc bots level in fixed range from `PmcBotMinLevel` to `PmcBotMaxLevel`

Trader assortment for each tier is on file `trader.json`

You can disable trader by set `trader` to false in config.json

`TraderInsurance` enables trader insurance with 100% instant return.

`TraderRepair` enables trader repair without degradation.

`InsuranceOnLab` enables insurance on Lab.

`InsuranceReturnsNothing` disables insurance by make it returns nothing. For all traders.

## Settings for bot generation on maps

Works only if `mapBotSettings` set to true.

`MapBossChanceAdjustment` add or remove percent for existing boss chance. For example if map boss chance is 35 and you set this parameter to 20 then boss chance will be 35 + 20.

`MapBossPartisanDisable` disable Partisan

`MapBossGoonsDisable` disable Goons

`MapMakePmcAlwaysHostile` by default in SPT-AKI 20% chance that PMC is friendly to player. This setting set this chance to 0.

`MapPmcBrainsAsLive` pmc uses only pmcUSEC and pmcBEAR brains.

`MapScavsAlwaysHasBackpack` Regular scavs always has backpack.

`MapScavsAlwaysHasArmor` Regular scavs always has (their crap) armor.

`MapScavsAlwaysHasHeadwear` Regular scavs always has (their crap)

`MapPlayerScavsBossBrainsOff` Player scavs only use pmcBot brains.

## Other settings

`PmcBackpackWeaponDisable` disables chance that PMC can have extra weapon in their backpack.

`EmissaryPmcBotsDisable` disables chance that PMC can have any type of accounts other than user (purple, green names etc).

`SeasonalEventsDisable` disables all seasonal events like Halloween etc.

`InsuranceDecreaseReturnTime` decrease return time for Prapor (2 - 3 hours) and Therapist (1 - 2 hours).

`InsuranceIncreaseStorageTime` increase storage time for Prapor and Therapist (14 days).

`FleaBlacklistDisable` disables Flea blacklist.

`RandomizeSeason` season set randomly after every raid.

`PlayerScavAlwaysHasBackpack` if true player scav always spawns with backpack.

`GpCoinsOnPmcAndScavs` regular scavs and pmc always has GP Coins in their backpacks.

`LegaMedalOnBosses` bosses has Lega Medal in their pockets (or not).

`RemoveAllTradersItemsFromFlea` removes all item from default traders from Flea except barter, food and keys.

`WeeklyBossEventDisable` disables weekly boss 100% spawn event

`CheeseQuests` disables gear and weapon conditions for same quests. For example DMR allowed for any quest required bolt action rifle.

## Installation

Put folder `BarlogM-Andern` from zip file into your `user/mods` folder

## Known issues

-   Mod does not work with any mod that alternate bot inventory
