import {inject, injectable} from "tsyringe";

import {ILogger} from "@spt/models/spt/utils/ILogger";
import {HashUtil} from "@spt/utils/HashUtil";
import {RandomUtil} from "@spt/utils/RandomUtil";
import {
    Inventory as PmcInventory
} from "@spt/models/eft/common/tables/IBotBase";
import {IBotType} from "@spt/models/eft/common/tables/IBotType";
import {EquipmentSlots} from "@spt/models/enums/EquipmentSlots";
import {ItemHelper} from "@spt/helpers/ItemHelper";
import {BotGeneratorHelper} from "@spt/helpers/BotGeneratorHelper";
import {BotLootGenerator} from "@spt/generators/BotLootGenerator";
import {BotWeaponGenerator} from "@spt/generators/BotWeaponGenerator";
import {
    GenerateWeaponResult
} from "@spt/models/spt/bots/GenerateWeaponResult";

import {RaidInfo} from "./RaidInfo";
import {WeaponGenerator} from "./WeaponGenerator";
import {isFactoryOrLab} from "./mapUtils";
import {Data} from "./Data";
import {GearItem} from "./models";
import {GearGeneratorHelper} from "./GearGeneratorHelper";
import {HelmetGenerator} from "./HelmetGenerator";

import * as config from "../config/config.json";

@injectable()
export class GearGenerator {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly SECURED_CONTAINER_BOSS = "5c0a794586f77461c458f892";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly POCKETS_1x4 = "557ffd194bdc2d28148b457f";

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("BotGeneratorHelper")
        protected botGeneratorHelper: BotGeneratorHelper,
        @inject("BotLootGenerator")
        protected botLootGenerator: BotLootGenerator,
        @inject("BotWeaponGenerator")
        protected botWeaponGenerator: BotWeaponGenerator,
        @inject("AndernWeaponGenerator")
        protected weaponGenerator: WeaponGenerator,
        @inject("AndernData") protected data: Data,
        @inject("AndernGearGeneratorHelper")
        protected gearGeneratorHelper: GearGeneratorHelper,
        @inject("AndernHelmetGenerator")
        protected helmetGenerator: HelmetGenerator
    ) {
    }

    generateInventoryBase(): PmcInventory {
        const equipmentId = this.hashUtil.generate();
        const equipmentTpl = "55d7217a4bdc2d86028b456d";

        const stashId = this.hashUtil.generate();
        const stashTpl = "566abbc34bdc2d92178b4576";

        const questRaidItemsId = this.hashUtil.generate();
        const questRaidItemsTpl = "5963866286f7747bf429b572";

        const questStashItemsId = this.hashUtil.generate();
        const questStashItemsTpl = "5963866b86f7747bfa1c4462";

        const sortingTableId = this.hashUtil.generate();
        const sortingTableTpl = "602543c13fee350cd564d032";

        return {
            items: [
                {
                    _id: equipmentId,
                    _tpl: equipmentTpl,
                },
                {
                    _id: stashId,
                    _tpl: stashTpl,
                },
                {
                    _id: questRaidItemsId,
                    _tpl: questRaidItemsTpl,
                },
                {
                    _id: questStashItemsId,
                    _tpl: questStashItemsTpl,
                },
                {
                    _id: sortingTableId,
                    _tpl: sortingTableTpl,
                },
            ],
            equipment: equipmentId,
            stash: stashId,
            questRaidItems: questRaidItemsId,
            questStashItems: questStashItemsId,
            sortingTable: sortingTableId,
            hideoutAreaStashes: {},
            fastPanel: {},
            favoriteItems: []
        };
    }

    getGearItem(
        presetName: string,
        botLevel: number,
        equipmentSlot: EquipmentSlots
    ): GearItem {
        switch (equipmentSlot) {
            case EquipmentSlots.EARPIECE: {
                return this.gearGeneratorHelper.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).headsets
                );
            }
            case EquipmentSlots.HEADWEAR: {
                return this.gearGeneratorHelper.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).helmets
                );
            }
            case EquipmentSlots.BACKPACK: {
                return this.gearGeneratorHelper.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).backpacks
                );
            }
            case EquipmentSlots.FACE_COVER: {
                return this.gearGeneratorHelper.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).face
                );
            }
            case EquipmentSlots.EYEWEAR: {
                return this.gearGeneratorHelper.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).eyewear
                );
            }
            case EquipmentSlots.SCABBARD: {
                return this.gearGeneratorHelper.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).sheath
                );
            }
        }
    }

    generateArmor(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        if (this.randomUtil.getBool()) {
            this.generateArmoredRig(
                presetName,
                botLevel,
                botRole,
                botInventory
            );
        } else {
            this.generateArmorVest(presetName, botLevel, botRole, botInventory);
            this.generateTacticalVest(
                presetName,
                botLevel,
                botRole,
                botInventory
            );
        }
    }

    generateArmoredRig(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const armoredRig = this.gearGeneratorHelper.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).armoredRigs
        );
        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.TACTICAL_VEST,
            botRole,
            botInventory,
            armoredRig.id,
            true,
            botLevel
        );
    }

    generateArmorVest(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const armor = this.gearGeneratorHelper.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).armor
        );
        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.ARMOR_VEST,
            botRole,
            botInventory,
            armor.id,
            true,
            botLevel
        );
    }

    generateTacticalVest(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const vest = this.gearGeneratorHelper.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).rigs
        );
        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.TACTICAL_VEST,
            botRole,
            botInventory,
            vest.id,
            false,
            botLevel
        );
    }

    generateChad(
        presetName: string,
        botRole: string,
        botInventory: PmcInventory,
        botLevel: number,
        raidInfo: RaidInfo
    ): boolean {
        const chance = Math.random() <= config.chadsPercentage / 100;

        const isMapOk = config.chadsOnFactoryAndLabOnly
            ? isFactoryOrLab(raidInfo.location)
            : true;

        if (chance && isMapOk && botLevel >= config.chadsMinimumLevel) {
            this.generateTacticalVest(
                presetName,
                botLevel,
                botRole,
                botInventory
            );
            this.generateChadArmor(presetName, botLevel, botRole, botInventory);

            if (this.randomUtil.getBool()) {
                this.generateChadHelmet(
                    presetName,
                    botLevel,
                    botRole,
                    botInventory,
                    raidInfo.isNight
                );

                this.generateGearItem(
                    presetName,
                    botLevel,
                    botRole,
                    botInventory,
                    EquipmentSlots.FACE_COVER
                );

                this.generateGearItem(
                    presetName,
                    botLevel,
                    botRole,
                    botInventory,
                    EquipmentSlots.EYEWEAR
                );
            } else {
                this.generateChadMask(
                    presetName,
                    botLevel,
                    botRole,
                    botInventory
                );
            }

            return true;
        }

        return false;
    }

    generateChadArmor(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        let armor = this.data.getGear(presetName, botLevel).chadArmor
        if (armor.length == 0) {
            armor = this.data.getGear(presetName, botLevel).armor
        }
        const selectedArmor = this.gearGeneratorHelper.weightedRandomGearItem(armor);

        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.ARMOR_VEST,
            botRole,
            botInventory,
            selectedArmor.id,
            true,
            botLevel
        );
    }

    generateChadHelmet(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean
    ): undefined {
        let helmets = this.data.getGear(presetName, botLevel).chadHelmets;
        if (helmets.length == 0) {
            helmets = this.data.getGear(presetName, botLevel).helmets;
        }
        const selectedHelmet = this.gearGeneratorHelper.weightedRandomGearItem(helmets);

        this.helmetGenerator.generateHelmet(
            botLevel,
            botRole,
            botInventory,
            selectedHelmet.id,
            isNightVision,
            true
        );
    }

    generateChadMask(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const mask = this.gearGeneratorHelper.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).chadMasks
        );

        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.FACE_COVER,
            botRole,
            botInventory,
            mask.id,
            false,
            botLevel
        );
    }

    generateGearItem(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        equipmentSlot: EquipmentSlots
    ): GearItem {
        const gearItem = this.getGearItem(presetName, botLevel, equipmentSlot);
        const equipmentItemTpl = gearItem.id;

        this.gearGeneratorHelper.putGearItemToInventory(
            equipmentSlot,
            botRole,
            botInventory,
            equipmentItemTpl,
            false,
            botLevel
        );

        return gearItem;
    }

    generateHeadwearAndEarpieceItem(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean
    ): undefined {
        const headwearItem = this.getGearItem(
            presetName,
            botLevel,
            EquipmentSlots.HEADWEAR
        );

        this.helmetGenerator.generateHelmet(
            botLevel,
            botRole,
            botInventory,
            headwearItem.id,
            isNightVision,
            isKittedHelmet
        );

        // for "SSh-68 steel helmet" only one earpiece "GSSh-01 active headset"
        if (headwearItem.id === "5c06c6a80db834001b735491") {
            this.gearGeneratorHelper.putGearItemToInventory(
                EquipmentSlots.EARPIECE,
                botRole,
                botInventory,
                "5b432b965acfc47a8774094e",
                false,
                botLevel
            )
            return;
        }

        if (this.helmetGenerator.isEarpieceIncompatible(headwearItem.id)) {
            return;
        }

        const earpieceItem = this.getGearItem(
            presetName,
            botLevel,
            EquipmentSlots.EARPIECE
        );

        const earpieceTpl = this.helmetGenerator.isEarpieceNotFullyCompatible(
            headwearItem.id
        )
            ? this.gearGeneratorHelper.replaceEarpiece(earpieceItem.id)
            : earpieceItem.id;

        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.EARPIECE,
            botRole,
            botInventory,
            earpieceTpl,
            false,
            botLevel
        );
    }

    public generateInventory(
        sessionId: string,
        botJsonTemplate: IBotType,
        botRole: string,
        isPmc: boolean,
        botLevel: number,
        raidInfo: RaidInfo
    ): PmcInventory {
        const presetName = this.data.getPresetName();
        const botInventory = this.generateInventoryBase();

        const presetTierConfig = this.data.getConfig(presetName, botLevel);
        const isNightVision = (raidInfo.isNight) ? this.randomUtil.getChance100(presetTierConfig.nightVisionPercent) : false;

        const isKittedHelmet = this.randomUtil.getChance100(presetTierConfig.kittedHelmetPercent);

        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.POCKETS,
            botRole,
            botInventory,
            this.POCKETS_1x4,
            false,
            botLevel
        );

        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.SECURED_CONTAINER,
            botRole,
            botInventory,
            this.SECURED_CONTAINER_BOSS,
            false,
            botLevel
        );

        if (
            !this.generateChad(
                presetName,
                botRole,
                botInventory,
                botLevel,
                raidInfo
            )
        ) {
            this.generateHeadwearAndEarpieceItem(
                presetName,
                botLevel,
                botRole,
                botInventory,
                isNightVision,
                isKittedHelmet
            );

            this.generateArmor(presetName, botLevel, botRole, botInventory);

            this.generateGearItem(
                presetName,
                botLevel,
                botRole,
                botInventory,
                EquipmentSlots.EYEWEAR
            );

            this.generateGearItem(
                presetName,
                botLevel,
                botRole,
                botInventory,
                EquipmentSlots.FACE_COVER
            );
        }

        this.generateGearItem(
            presetName,
            botLevel,
            botRole,
            botInventory,
            EquipmentSlots.BACKPACK
        );
        this.generateGearItem(
            presetName,
            botLevel,
            botRole,
            botInventory,
            EquipmentSlots.SCABBARD
        );

        const generatedWeapon = this.weaponGenerator.generateWeapon(
            presetName,
            botLevel,
            botInventory.equipment,
            isNightVision
        );

        botInventory.items.push(...generatedWeapon.weaponWithMods);

        const generatedWeaponResult: GenerateWeaponResult = {
            weapon: generatedWeapon.weaponWithMods,
            chosenAmmoTpl: generatedWeapon.ammoTpl,
            chosenUbglAmmoTpl: undefined,
            weaponMods: botJsonTemplate.inventory.mods,
            weaponTemplate: generatedWeapon.weaponTemplate,
        };

        this.botWeaponGenerator.addExtraMagazinesToInventory(
            generatedWeaponResult,
            botJsonTemplate.generation.items.magazines,
            botInventory,
            botRole
        );

        if (config.lootingBotsCompatibility) {
            botJsonTemplate.generation.items.backpackLoot.weights = {"0": 1};
            botJsonTemplate.generation.items.backpackLoot.whitelist = {};
        }

        this.botLootGenerator.generateLoot(
            sessionId,
            botJsonTemplate,
            isPmc,
            botRole,
            botInventory,
            botLevel
        );

        return botInventory;
    }
}
