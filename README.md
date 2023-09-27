# Andern mod for SPT-AKI

[![GitHub Tags](https://img.shields.io/github/v/tag/barlog-m/SPT-AKI-Andern?color=0298c3&label=version&style=flat-square)](https://github.com/barlog-m/oceanic-primal-visual-studio-code/tags)
[![MIT License](https://img.shields.io/badge/license-MIT-0298c3.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Andern** is a mod for [SPT-AKI](https://www.sp-tarkov.com/)

Idea of this mod is to rebalance a bit the game for better single player experience.

* Give PMC bots decent weapon from presets. Bots weapon ranged tiers: before 15 - tier one, from 15 to 30 - tier two, from 28 to 40 - tier three, and above 40 - tier four.

* Generate PMC with levels in range ± 10 levels from yours. Config parameter `pmcBotLevelDelta`.

* Add trader that sell you couple weapon modules to make weapon until level 15 a bit less crap. And sells you keys for quests witch hard to find because of high randomness of loot in the game.

* Disable Flea Market until level 42. Config parameter `fleaMinUserLevel`. It add more sense to looting because with Flea you can easy just buy everything your need for craft and hideout update.

Bots get random weapon from lists. There is no pistols and other crap that bots can't use very good.
Also bots use specified ammo for each caliber from list.

For example list of ammo for tier one weapon presets is in file `res\one\ammo.json`

Preset made in the game and then exported with [SPT-AKI Profile Editor](https://hub.sp-tarkov.com/files/file/184-spt-aki-profile-editor/)

You can make your own preset. Just be sure that `ammo.json` contain record for weapon caliber.

Preset must have empty magazine and empty chamber.

Preset must have one tactical device.

Mod does not support weapon without magazines.

At night raids tactical device replaced to [Zenit Klesch-2IKS](https://escapefromtarkov.fandom.com/wiki/Zenit_Klesch-2IKS_IR_illuminator_with_laser)

At night raids all PMC wear helmets with night vision googles

## Trader sells after level 40 this ammo

* https://escapefromtarkov.fandom.com/wiki/.300_Blackout_AP
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_BP_gzh
* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_7N40

Trader can insure with zero return time and 100% return chance.

Trader can repair without degradation.

## Installation

Put folder `BarlogM-Andern` from zip file into your `user/mods` folder

## Known issues

* If you close game client with Alt+F4 you have to restart server becouse mod stops working.
* Mod does not work with [Algorithmic Level Progression](https://hub.sp-tarkov.com/files/file/1400-algorithmic-level-progression/)

Tier One Ammo

* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_PS_gs
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_HP
* https://escapefromtarkov.fandom.com/wiki/5.56x45mm_FMJ
* https://escapefromtarkov.fandom.com/wiki/.366_TKM_EKO
* https://escapefromtarkov.fandom.com/wiki/7.62x51mm_TCW_SP
* https://escapefromtarkov.fandom.com/wiki/7.62x54mm_R_LPS_gzh

Tier Two Ammo

* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_PP_gs
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_PS_gzh
* https://escapefromtarkov.fandom.com/wiki/5.56x45mm_M856A1
* https://escapefromtarkov.fandom.com/wiki/.366_TKM_EKO
* https://escapefromtarkov.fandom.com/wiki/7.62x51mm_BCP_FMJ
* https://escapefromtarkov.fandom.com/wiki/7.62x54mm_R_T-46M_gzh

Tier Three Ammo

* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_BP_gs
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_PS_gzh
* https://escapefromtarkov.fandom.com/wiki/5.56x45mm_M856A1
* https://escapefromtarkov.fandom.com/wiki/.366_TKM_AP-M
* https://escapefromtarkov.fandom.com/wiki/7.62x51mm_BCP_FMJ
* https://escapefromtarkov.fandom.com/wiki/7.62x54mm_R_PS_gzh
* https://escapefromtarkov.fandom.com/wiki/.300_Blackout_M62_Tracer

Tier Four Ammo

* https://escapefromtarkov.fandom.com/wiki/5.45x39mm_7N40
* https://escapefromtarkov.fandom.com/wiki/7.62x39mm_BP_gzh
* https://escapefromtarkov.fandom.com/wiki/5.56x45mm_M855A1
* https://escapefromtarkov.fandom.com/wiki/7.62x51mm_M80
* https://escapefromtarkov.fandom.com/wiki/7.62x54mm_R_BT_gzh
* https://escapefromtarkov.fandom.com/wiki/.300_Blackout_AP
