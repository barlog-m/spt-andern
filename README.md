# Andern mod for SPT-AKI

[![GitHub Tags](https://img.shields.io/github/v/tag/barlog-m/SPT-AKI-Andern?color=0298c3&label=version&style=flat-square)](https://github.com/barlog-m/SPT-AKI-Andern/tags)
[![MIT License](https://img.shields.io/badge/license-MIT-0298c3.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Andern** is a mod for [SPT-AKI](https://www.sp-tarkov.com/)

Idea of this mod is to rebalance a bit the game for better single player experience.

* Gives PMC bots decent weapon from handmade presets.

* Gives PMC good gear. Every PMC wear armor, helmet, rig, headphones, face cover and glasses.

* Generates PMC with levels in configurable range.

* Add trader that sell you couple weapon modules to make weapon until level 15 a bit less crap. And sells you keys for quests witch hard to find because of high randomness of loot in the game.

* Mod allows to change Flea Market access level. Config parameter `fleaMinUserLevel`. You can increase it to level 42 to add more sense to looting because with Flea you can easy just buy everything your need for craft and hideout update.

* Mod allows to increase static and loose loot multipliers. Options `looseLootMultiplier` and `staticLootMultiplier`.

* Mod increase keys and cards spawn chance.

Weapon and gear split by tiers. Tiers is described in `preset_name/preset.json` file. Mod has two presets *meta* and *live*. Choise *live* if you want more veraity and close to live Tarkov expirience.

You can disable PMC bot level generator with option `pmcLevel`.

You can disable PMC bot gear generator with option `pmcGear`. Then mod only generate weapon.

Bots get random weapon from presets. Also, bots use specified ammo for each caliber from presets.

Preset made in the game and then exported with [SPT-AKI Profile Editor](https://hub.sp-tarkov.com/files/file/184-spt-aki-profile-editor/)

You can make your own preset. Just be sure that `ammo.json` contain record for weapon caliber.

Tactical device is not obligatory anymore.

Mod support any weapon: shotguns, pistols, revolvers, grenade launchers etc.

At night raids tactical device replaced to infrared one.

At night raids all PMC wear helmets with night vision googles.

PMC wears gear from gear.json for their level.

## PMC Bots Level configuration

Player level - `pmcBotLevelDownDelta`. Player level + `pmcBotLevelUpDelta`

if `useFixedPmcBotLevelRange` true then pmc bots level in fixed range from `pmcBotMinLevel` to `pmcBotMaxLevel`

## Trader sells after level 40 this ammo

* https://escapefromtarkov.fandom.com/wiki/.300_Blackout_AP
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_BP_gzh
* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_7N40

Trader assortment for each tier is on file `trader.json`

You can disable trader by set `trader` to false in config.json

`traderInsurance` enables trader insurance with 100% instant return.

`traderRepair` enables trader repair without degradation.

`insuranceOnLab` enables insurance on Lab.

PMC bots can use "chads" armor. It possible only in day raids.

Settings in config 'chadsOnFactoryAndLabOnly', 'chadsPercentage' and 'chadsMinimumLevel',

`chadsMinimumLevel` means bot can wear chads armor only if his level `chadsMinimumLevel` or higher.

## Keys spawn settings

`looseLootKeyAndCardsSettings` disables or enable any keys and keycards settings

`looseLootKeysRelativeProbabilityThreshold` modified only keys with multiplier below this value. Some keys already has high relative probability chance. Mod don't increase probability for keys above this value because places for loose loot are limited.

`looseLootKeysRelativeProbabilityMultiplier` spawn multiplier. If value is 1 than nothing changes.

`looseLootKeysPercentage` loose loot keys spawn percentage. Percent is from origin SPT-AKI value. Default is different for different keys.

`looseLootCardsPercentage` loose loot cards spawn percentage. Same for cards. Cards is different type of loot

`staticLootKeysRelativeProbability` containers keys spawn chance. Key containers is drawers and jackets. The value is based on biggest among other keys.

## Settings for bot generation on maps

Works only if `mapBotSettings` set to true.

`mapMaxBotBuffMultiplier` increases or decreases amount of bots on maps.

`mapMaxBotBuffExcludeFactory` excludes Factory from max bot buff multiplier.

`mapMaxBotBuffExcludeLab` excludes Lab from max bot buff multiplier,

`mapMaxBotBuffExcludeStreets` excludes Streets from max bot buff multiplier,

`mapStreetsMaxBotCap` maximum bot capacity for Streets. Ignored if 0,

`mapPmcBotDifficulty` "easy", "normal", "hard", "impossible"

`mapBotAccuracyMultiplier` decreases bot accuracy and increase scattering.

`mapBossChanceBuff` add or remove percent for existing boss chance. For example if map boss chance is 35 and you set this parameter to 20 then boss chance will be 35 + 20.

`mapScavToPmcConvertMultiplier` can increase or decrease percent of scavs converted to PMC (changes amount of PMC on map)

`mapMakePmcAlwaysHostile` by default in SPT-AKI 20% chance that PMC is friendly to player. This setting set this chance to 0.

`mapDisableRogueConvertToPmc` disables converting rogues to PMC.

`mapDisableRaiderConvertToPmc` disables converting raiders to PMC.

`mapPmcBrainsConfig` if set to "default" then does nothing. Loads `brains/[value].json` file with config which brain will be selected as PMC brain. For example "noboss" will load `brains/noboss.json` as brains config.

## Other settings

`disablePmcBackpackWeapon` disables chance that PMC can have extra weapon in their backpack.

`disableEmissaryPmcBots` disables chance that PMC can have any type of accounts other than user (purple, green names etc).

`disableSeasonalEvents` disables all seasonal events like Halloween etc.

`lootingBotsCompatibility` disable loot generation in PMC's backpack for compatibility with Looting Bots mod. Works only if `pmcGear` enabled.

`scavCaseLootValueMultiplier` multiplies each value range to improve Scav Case loot.

`insuranceDecreaseReturnTime` decrease return time for Prapor (2 - 3 hours) and Therapist (1 - 2 hours).

`insuranceIncreaseStorageTime` increase storage time for Prapor and Therapist (14 days).

`cheeseQuests` disable gear and weapon conditions for same quests. For example DMR allowed for any quest required bolt action rifle.

## Installation

Put folder `BarlogM-Andern` from zip file into your `user/mods` folder

## Known issues

* If you close game client with Alt+F4 you have to restart server becouse mod stops working.
* Mod does not work with [Algorithmic Level Progression](https://hub.sp-tarkov.com/files/file/1400-algorithmic-level-progression/)
