import { inject, injectable } from "tsyringe";

import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt-aki/models/eft/common/tables/IBotType";
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { BotGeneratorHelper } from "@spt-aki/helpers/BotGeneratorHelper";
import { BotLootGenerator } from "@spt-aki/generators/BotLootGenerator";
import { BotWeaponGenerator } from "@spt-aki/generators/BotWeaponGenerator";
import { GenerateWeaponResult } from "@spt-aki/models/spt/bots/GenerateWeaponResult";

import { RaidInfo } from "./RaidInfo";
import { WeaponGenerator } from "./WeaponGenerator";
import { isFactoryOrLab } from "./mapUtils";
import { Data } from "./Data";
import { NightHeadwear } from "./NightHeadwear";
import { GearItem } from "./models";

import * as config from "../config/config.json";

const NFM_THOR = "60a283193cb70855c43a381d";
const ZABRALO = "545cdb794bdc2d3a198b456a";
const ALTYN_HELMET = "5aa7e276e5b5b000171d0647";
const ALTYN_FACE_SHIELD = "5aa7e373e5b5b000137b76f0";
const RYS_HELMET = "5f60c74e3b85f6263c145586";
const RYS_FACE_SHIELD = "5f60c85b58eff926626a60f7";

@injectable()
export class GearGenerator {
    private readonly SECURED_CONTAINER_BOSS = "5c0a794586f77461c458f892";
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
        @inject("AndernNightHeadwear")
        protected nightHeadwear: NightHeadwear,
        @inject("AndernData") protected data: Data
    ) {}

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
        };
    }

    getGearItem(
        presetName: string,
        botLevel: number,
        equipmentSlot: EquipmentSlots
    ): GearItem {
        switch (equipmentSlot) {
            case EquipmentSlots.EARPIECE: {
                return this.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).headsets
                );
            }
            case EquipmentSlots.HEADWEAR: {
                return this.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).helmets
                );
            }
            case EquipmentSlots.BACKPACK: {
                return this.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).backpacks
                );
            }
            case EquipmentSlots.FACE_COVER: {
                return this.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).face
                );
            }
            case EquipmentSlots.EYEWEAR: {
                return this.weightedRandomGearItem(
                    this.data.getGear(presetName, botLevel).eyewear
                );
            }
            case EquipmentSlots.SCABBARD: {
                return this.weightedRandomGearItem(
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
        const armoredRig = this.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).armoredRigs
        );
        this.putGearItemToInventory(
            EquipmentSlots.TACTICAL_VEST,
            botRole,
            botInventory,
            armoredRig.id
        );
    }

    generateArmorVest(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const armor = this.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).armor
        );
        this.putGearItemToInventory(
            EquipmentSlots.ARMOR_VEST,
            botRole,
            botInventory,
            armor.id
        );
    }

    generateTacticalVest(
        presetName: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const vest = this.weightedRandomGearItem(
            this.data.getGear(presetName, botLevel).rigs
        );
        this.putGearItemToInventory(
            EquipmentSlots.TACTICAL_VEST,
            botRole,
            botInventory,
            vest.id
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
            this.generateChadArmor(presetName, botRole, botInventory);
            this.generateChadHelmet(presetName, botRole, botInventory);
            return true;
        }

        return false;
    }

    generateChadArmor(
        presetName: string,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const armorId = this.randomUtil.getBool() ? NFM_THOR : ZABRALO;

        this.putGearItemToInventory(
            EquipmentSlots.ARMOR_VEST,
            botRole,
            botInventory,
            armorId
        );
    }

    generateChadHelmet(
        presetName: string,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const helmetId = this.randomUtil.getBool() ? RYS_HELMET : ALTYN_HELMET;

        const helmetItemId = this.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            helmetId
        );

        const faceShieldId =
            helmetId === ALTYN_HELMET ? ALTYN_FACE_SHIELD : RYS_FACE_SHIELD;

        this.putModItemToInventory(
            botRole,
            botInventory,
            faceShieldId,
            "mod_equipment",
            helmetItemId
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
        this.putGearItemToInventory(
            equipmentSlot,
            botRole,
            botInventory,
            equipmentItemTpl
        );
        return gearItem;
    }

    putGearItemToInventory(
        equipmentSlot: EquipmentSlots,
        botRole: string,
        botInventory: PmcInventory,
        equipmentItemTpl: string
    ): string {
        const id = this.hashUtil.generate();

        const [isItemExists, itemTemplate] =
            this.itemHelper.getItem(equipmentItemTpl);
        if (!isItemExists) {
            this.logger.error(
                `[Andern] wrong template id ${equipmentItemTpl} for slot HEADWEAR`
            );
        }

        let extraProps;
        try {
            extraProps = this.botGeneratorHelper.generateExtraPropertiesForItem(
                itemTemplate,
                botRole
            );
        } catch (e) {
            this.logger.error(
                `[Andern] wrong template id ${equipmentItemTpl} for slot ${equipmentSlot}`
            );
        }

        const item = {
            _id: id,
            _tpl: equipmentItemTpl,
            parentId: botInventory.equipment,
            slotId: equipmentSlot,
            ...extraProps,
        };

        botInventory.items.push(item);
        return id;
    }

    putModItemToInventory(
        botRole: string,
        botInventory: PmcInventory,
        equipmentItemTpl: string,
        slotId: string,
        parentId: string
    ): string {
        const id = this.hashUtil.generate();

        const [isItemExists, itemTemplate] =
            this.itemHelper.getItem(equipmentItemTpl);
        if (!isItemExists) {
            this.logger.error(
                `[Andern] wrong template id ${equipmentItemTpl} for slot HEADWEAR`
            );
        }

        const item = {
            _id: id,
            _tpl: equipmentItemTpl,
            parentId: parentId,
            slotId: slotId,
            ...this.botGeneratorHelper.generateExtraPropertiesForItem(
                itemTemplate,
                botRole
            ),
        };

        item.upd.Togglable.On = true;

        botInventory.items.push(item);
        return id;
    }

    weightedRandomGearItem(items: GearItem[]): GearItem {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }
        return items[0];
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

        this.putGearItemToInventory(
            EquipmentSlots.POCKETS,
            botRole,
            botInventory,
            this.POCKETS_1x4
        );

        this.putGearItemToInventory(
            EquipmentSlots.SECURED_CONTAINER,
            botRole,
            botInventory,
            this.SECURED_CONTAINER_BOSS
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
            if (raidInfo.isNight) {
                this.generateNightHeadwear(botLevel, botRole, botInventory);

                this.generateGearItem(
                    presetName,
                    botLevel,
                    botRole,
                    botInventory,
                    EquipmentSlots.EARPIECE
                );
            } else {
                const helmGearItem = this.generateGearItem(
                    presetName,
                    botLevel,
                    botRole,
                    botInventory,
                    EquipmentSlots.HEADWEAR
                );
                if (helmGearItem.name === "SSh-68 steel helmet") {
                    const equipmentItemTpl = "5b432b965acfc47a8774094e";
                    this.putGearItemToInventory(
                        EquipmentSlots.EARPIECE,
                        botRole,
                        botInventory,
                        equipmentItemTpl
                    );
                } else {
                    this.generateGearItem(
                        presetName,
                        botLevel,
                        botRole,
                        botInventory,
                        EquipmentSlots.EARPIECE
                    );
                }
            }

            this.generateArmor(presetName, botLevel, botRole, botInventory);

            this.generateGearItem(
                presetName,
                botLevel,
                botRole,
                botInventory,
                EquipmentSlots.EYEWEAR
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
            EquipmentSlots.FACE_COVER
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
            raidInfo.isNight
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
            botJsonTemplate.generation.items.backpackLoot.weights = { "0": 1 };
            botJsonTemplate.generation.items.backpackLoot.whitelist = [];
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

    generateNightHeadwear(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        this.nightHeadwear.generateNightHeadwear(
            botLevel,
            botRole,
            botInventory
        );
    }
}
