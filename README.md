# Andern mod for SPT-AKI

[![GitHub Tags](https://img.shields.io/github/v/tag/barlog-m/SPT-AKI-Andern?color=0298c3&label=version&style=flat-square)](https://github.com/barlog-m/SPT-AKI-Andern/tags)
[![MIT License](https://img.shields.io/badge/license-MIT-0298c3.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Andern** is a mod for [SPT-AKI](https://www.sp-tarkov.com/)

Idea of this mod is to rebalance a bit the game for better single player experience.

* Gives PMC bots decent weapon from handmade presets.

* Gives PMC good gear. Every PMC wear armor, helmet, rig, headphones, face cover and glasses.

* Gives PMC better backpack loot.

* Generates PMC with levels in configurable range.

* Add trader that sell you couple weapon modules to make weapon until level 15 a bit less crap. And sells you keys for quests witch hard to find because of high randomness of loot in the game.

* Mod allows to change Flea Market access level. Config parameter `fleaMinUserLevel`. You can increase it to level 42 to add more sense to looting because with Flea you can easy just buy everything your need for craft and hideout update.

* Mod allows to increase static and loose loot multipliers. Options `looseLootMultiplier` and `staticLootMultiplier`.

* Mod increase keys and cards spawn chance.

Weapon and gear split by tiers. Tiers is described in `preset_name/preset.json` file. Mod has two presets *meta* and *live*. Choise *live* if you want more veraity and close to live Tarkov expirience.

You can disable PMC bot level generator with option `pmcLevel`.

You can disable PMC weapon generator with option `pmcWeapon`.

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

Trader assortment for each tier is on file `trader.json`

You can disable trader by set `trader` to false in config.json

`traderInsurance` enables trader insurance with 100% instant return.

`traderRepair` enables trader repair without degradation.

`insuranceOnLab` enables insurance on Lab.

PMC bots can use "chads" armor. It possible only in day raids.

Settings in config 'chadsOnFactoryAndLabOnly', 'chadsPercentage' and 'chadsMinimumLevel',

`chadsMinimumLevel` means bot can wear chads armor only if his level `chadsMinimumLevel` or higher.

## PMC backpack loot settings

`pmcBackpackLoot` enable/disable custom backpack loot pools

`disableBotBackpackLoot` disable backpack loot completely

##### Backpack Loot Extended Config: `backpack_config.json`

`include_weapons` enable/disable loose weapons in backpack

`duplicate_item_limit` Limit the amount of the same item that can spawn in a backpack

`custom_map_loot_tables` Use map specific backpack loot configs. `Use the laboratory example to see how this can be done. Note: If you have a config for a map, it overwrites the global weights`

`global`Settings for global map config

`global.weights` Weights for each loot table, see loot_tables for how they relate with each other.

`global.keycard_chance` Chance a keycard could spawn in a backpack

`global.rare_key_chance` Chance a rare key could spawn in a backpack

`global.include_normal_keys` Enable normal key loot pool in backpacks.

`loot_tables` extremely rare, rare, valuable and common are all that are used in par with the weights array and in that order. You can add or remove items from the loot pools here.

## Loot settings

`looseLootMultiplier` loose loot multiplier

`staticLootMultiplier` static loot multiplier

`increaseStaticLootKeysSpawn` increases static loot keys spawn (for Jackets and Drawers)

`increaseLooseLootKeysSpawn` increases loose loot keys spawn

`increaseLooseLootCardsSpawn` increases loose loot cards spawn

`increaseRareLootSpawn` increases rare loose loot spawn (Some electronics on Labs and Lighthouse)

`scavCaseLootValueMultiplier` multiplies each value range to improve Scav Case loot.

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

`mapBotBrainsTuning` slightly decreases PMC and Raider accuracy.

`mapBotDisablePmcTalkativeness` disables PMC talkativeness for normal difficulty.

## Other settings

`disablePmcBackpackWeapon` disables chance that PMC can have extra weapon in their backpack.

`disableEmissaryPmcBots` disables chance that PMC can have any type of accounts other than user (purple, green names etc).

`disableSeasonalEvents` disables all seasonal events like Halloween etc.

`lootingBotsCompatibility` disable loot generation in PMC's backpack for compatibility with Looting Bots mod. Works only if `pmcGear` enabled.

`insuranceDecreaseReturnTime` decrease return time for Prapor (2 - 3 hours) and Therapist (1 - 2 hours).

`insuranceIncreaseStorageTime` increase storage time for Prapor and Therapist (14 days).

`cheeseQuests` disable gear and weapon conditions for same quests. For example DMR allowed for any quest required bolt action rifle.

`vssValOverheatMultiplier` changes heat modifier for VSS, VAL and all Caliber9x39 ammo. Recommended value is 0.85.

`fleaBlacklistDisable` disables Flea blacklist.

`season` set season, can be winter, spring, summer and autumn.

`seasonRandom` season set randomly after every raid.

`disableBtr` disables BTR on all maps.

`playerScavAlwaysHasBackpack` if true player scav always spawns with backpack.

## Installation

Put folder `BarlogM-Andern` from zip file into your `user/mods` folder

## Known issues

* If you close game client with Alt+F4 you have to restart server because mod stops working.
* Mod does not work with [Algorithmic Level Progression](https://hub.sp-tarkov.com/files/file/1400-algorithmic-level-progression/)

