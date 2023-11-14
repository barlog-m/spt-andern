# Andern mod for SPT-AKI

[![GitHub Tags](https://img.shields.io/github/v/tag/barlog-m/SPT-AKI-Andern?color=0298c3&label=version&style=flat-square)](https://github.com/barlog-m/oceanic-primal-visual-studio-code/tags)
[![MIT License](https://img.shields.io/badge/license-MIT-0298c3.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Andern** is a mod for [SPT-AKI](https://www.sp-tarkov.com/)

Idea of this mod is to rebalance a bit the game for better single player experience.

* Give PMC bots decent weapon from handmade presets.

* Give PMC good gear. Every PMC wear armor, helmet, rig, headphones, face cover and glasses.

* Generate PMC with levels in configurable range.

* Add trader that sell you couple weapon modules to make weapon until level 15 a bit less crap. And sells you keys for quests witch hard to find because of high randomness of loot in the game.

* Mod allows to change Flea Market access level. Config parameter `fleaMinUserLevel`. You can increase it to level 42 to add more sense to looting because with Flea you can easy just buy everything your need for craft and hideout update.

* Mod allows to increase static and loose loot multipliers. Options `looseLootMultiplier` and `staticLootMultiplier`.

* Mod increse keys and cards spawn chance.

Weapon and gear split by tiers. Tiers is described in `preset_name/preset.json` file. Mod has two presets *meta* and *live*. Choise *live* if you want more veraity and close to live Tarkov expirience.

You can disable PMC bot level generator with option `pmcLevel`.

You can disable PMC bot gear generator with option `pmcGear`. Then mod only generate weapon.

Bots get random weapon from presets. Also bots use specified ammo for each caliber from presets.

Preset made in the game and then exported with [SPT-AKI Profile Editor](https://hub.sp-tarkov.com/files/file/184-spt-aki-profile-editor/)

You can make your own preset. Just be sure that `ammo.json` contain record for weapon caliber.

Tactical device is not obligatory anymore.

Mod support any weapon: shotguns, pistols, revolvers, grenade launchers etc.

At night raids tactical device replaced to [Zenit Klesch-2IKS](https://escapefromtarkov.fandom.com/wiki/Zenit_Klesch-2IKS_IR_illuminator_with_laser)

At night raids all PMC wear helmets with night vision googles.

PMC wear gear from gear.json for their level.

## PMC Bots Level configuration

Player level - `pmcBotLevelDownDelta`. Player level + `pmcBotLevelUpDelta`

if `useFixedPmcBotLevelRange` true then pmc bots level in fixed range from `pmcBotMinLevel` to `pmcBotMaxLevel`

## Trader sells after level 40 this ammo

* https://escapefromtarkov.fandom.com/wiki/.300_Blackout_AP
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_BP_gzh
* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_7N40

Trader assortiment for each tier is on file `trader.json`

Trader can insure with zero return time and 100% return chance.

Trader can repair without degradation.

You cand disable trader by set `trader` to false in config.json

Enable insurance on Lab. Option `insuranceOnLab`.

PMC bots can use "chads" armor (Altyn or Rys with Zabralo or THOR)

It possible only in day raids.

Settings in config 'chadsOnFactoryAndLabOnly', 'chadsPercentage' and 'chadsMinimumLevel',

`chadsMinimumLevel` means bot can wear chads armor only if his level `chadsMinimumLevel` or higher.

## Keys spawn settings

`looseLootKeysRelativeProbabilityThreshold` modified only keys with multiplier below this value. Some keys already has high relative probability chance. Mod don't increase probability for keys above this value because places for loose loot are limited.

`looseLootKeysRelativeProbabilityMultiplier` spawn multiplier. If value is 1 than nothing changes.

`looseLootKeysPercentage` loose loot keys spawn percentage. Percent is from origin SPT-AKI value. Default is different for different keys.

`looseLootCardsPercentage` loose loot cards spawn percentage. Same for cards. Cards is different type of loot

`staticLootKeysRelativeProbability` containers keys spawn chance. Key containers is drawers and jackets. The value is based on biggest among other keys.

## Settings for bot generation on maps

Works only if `mapBotSettings` set to true.

`mapMaxBotBuffMultiplier` increase or decrease amount of bots on maps.

`mapMaxBotBuffExcludeFactory` exclude Factory from max bot buff multiplier.

`mapMaxBotBuffExcludeLab` exclude Lab from max bot buff multiplier,

`mapMaxBotBuffExcludeStreets` exclude Streets from max bot buff multiplier,

`mapStreetsMaxBotCap` maximum bot capacity for Streets. Ignored if 0,

`mapPmcBotDifficulty` "easy", "normal", "hard", "impossible"

`mapBotAccuracyMultiplier` decrease bot accuracy and increase scattering.

`mapBossChanceBuff` add or remove percent for existing boss chance. For example if map boss chance is 35 and you set this parameter to 20 then boss chance will be 35 + 20.

`mapScavToPmcConvertMultiplier` can increase or decrease percent of scavs converted to PMC (changes amount of PMC on map)

`mapMakePmcAlwaysHostile` by default in SPT-AKI 20% chance that PMC is friendly to player. This setting set this chance to 0.

`mapDisableRogueConvertToPmc` disable converting rogues to PMC.

`mapDisableRaiderConvertToPmc` disable converting raiders to PMC.

`mapPmcBrainsConfig` if set to "default" then does nothing. Loads `brains/[value].json` file with config which brain will be selected as PMC brain. For example "noboss" will load `brains/noboss.json` as brains config.

## Other settings

`disablePmcBackpackWeapon` disable chance that PMC can have extra weapon in their backpack.

`disableEmissaryPmcBots` disable chance that PMC can have any type of accounts other than user (purple, green names etc).

`disableSeasonalEvents` disables all seasonal events like halloween etc.

`lootingBotsCompatibility` disable loot generation in PMC's backpack for compatibility with Looting Bots mod. Works only if `pmcGear` enabled.

`fixBossSpecialLoot` if true force bosses always have their special loot like `Keycard with a blue marking` on `Sanitar`. Works only if `pmcGear` true.

## Installation

Put folder `BarlogM-Andern` from zip file into your `user/mods` folder

## Known issues

* If you close game client with Alt+F4 you have to restart server becouse mod stops working.
* Mod does not work with [Algorithmic Level Progression](https://hub.sp-tarkov.com/files/file/1400-algorithmic-level-progression/)
