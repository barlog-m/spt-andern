import { inject, injectable } from "tsyringe";

import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt-aki/models/eft/common/tables/IBotType";
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";
import { BotGeneratorHelper } from "@spt-aki/helpers/BotGeneratorHelper";
import { BotLootGenerator } from "@spt-aki/generators/BotLootGenerator";

import { RaidInfo } from "./RaidInfo";
import { WeaponGenerator } from "./WeaponGenerator";
import { isFactoryOrLab } from "./mapUtils";
import { PresetData } from "./PresetData";
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
    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("BotGeneratorHelper")
        protected botGeneratorHelper: BotGeneratorHelper,
        @inject("BotLootGenerator")
        protected botLootGenerator: BotLootGenerator,
        @inject("AndernNightHeadwear")
        protected nightHeadwear: NightHeadwear,
        @inject("AndernPresetData") protected presetData: PresetData
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

    getGearItem(botLevel: number, equipmentSlot: EquipmentSlots): GearItem {
        switch (equipmentSlot) {
            case EquipmentSlots.EARPIECE: {
                return this.weightedRandomGearItem(
                    this.presetData.getGear(botLevel).headsets
                );
            }
            case EquipmentSlots.HEADWEAR: {
                return this.weightedRandomGearItem(
                    this.presetData.getGear(botLevel).helmets
                );
            }
            case EquipmentSlots.BACKPACK: {
                return this.weightedRandomGearItem(
                    this.presetData.getGear(botLevel).backpacks
                );
            }
            case EquipmentSlots.FACE_COVER: {
                return this.weightedRandomGearItem(
                    this.presetData.getGear(botLevel).face
                );
            }
            case EquipmentSlots.EYEWEAR: {
                return this.weightedRandomGearItem(
                    this.presetData.getGear(botLevel).eyewear
                );
            }
        }
    }

    generateArmor(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        if (this.randomUtil.getBool()) {
            this.generateArmoredRig(botLevel, botRole, botInventory);
        } else {
            this.generateArmorVest(botLevel, botRole, botInventory);
            this.generateTacticalVest(botLevel, botRole, botInventory);
        }
    }

    generateArmoredRig(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const armoredRig = this.weightedRandomGearItem(
            this.presetData.getGear(botLevel).armoredRigs
        );
        this.putGearItemToInventory(
            EquipmentSlots.TACTICAL_VEST,
            botRole,
            botInventory,
            armoredRig.id
        );
    }

    generateArmorVest(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const armor = this.weightedRandomGearItem(
            this.presetData.getGear(botLevel).armor
        );
        this.putGearItemToInventory(
            EquipmentSlots.ARMOR_VEST,
            botRole,
            botInventory,
            armor.id
        );
    }

    generateTacticalVest(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const vest = this.weightedRandomGearItem(
            this.presetData.getGear(botLevel).rigs
        );
        this.putGearItemToInventory(
            EquipmentSlots.TACTICAL_VEST,
            botRole,
            botInventory,
            vest.id
        );
    }

    generateChad(
        botRole: string,
        botInventory: PmcInventory,
        botLevel: number,
        raidInfo: RaidInfo
    ): boolean {
        const chance = Math.random() <= config.chadsPercentage / 100;

        const isMapOk = config.chadsOnFactoryAndLabOnly
            ? isFactoryOrLab(raidInfo.location)
            : false;

        if (chance && isMapOk && botLevel >= config.chadsMinimumLevel) {
            this.generateTacticalVest(botLevel, botRole, botInventory);
            this.generateChadArmor(botRole, botInventory);
            this.generateChadHelmet(botRole, botInventory);
            return true;
        }

        return false;
    }

    generateChadArmor(botRole: string, botInventory: PmcInventory): undefined {
        const armorId = this.randomUtil.getBool() ? NFM_THOR : ZABRALO;

        this.putGearItemToInventory(
            EquipmentSlots.ARMOR_VEST,
            botRole,
            botInventory,
            armorId
        );
    }

    generateChadHelmet(botRole: string, botInventory: PmcInventory): undefined {
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
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        equipmentSlot: EquipmentSlots
    ): GearItem {
        const gearItem = this.getGearItem(botLevel, equipmentSlot);
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
        const itemTemplate =
            this.databaseServer.getTables().templates.items[equipmentItemTpl];

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
        const itemTemplate =
            this.databaseServer.getTables().templates.items[equipmentItemTpl];

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
        const botInventory = this.generateInventoryBase();

        const pcketsTpl = "557ffd194bdc2d28148b457f";
        this.putGearItemToInventory(
            EquipmentSlots.POCKETS,
            botRole,
            botInventory,
            pcketsTpl
        );

        const securedContainerTpl = "5c093ca986f7740a1867ab12";
        this.putGearItemToInventory(
            EquipmentSlots.SECURED_CONTAINER,
            botRole,
            botInventory,
            securedContainerTpl
        );

        if (!this.generateChad(botRole, botInventory, botLevel, raidInfo)) {
            if (raidInfo.isNight) {
                this.generateNightHeadwear(botLevel, botInventory);

                this.generateGearItem(
                    botLevel,
                    botRole,
                    botInventory,
                    EquipmentSlots.EARPIECE
                );
            } else {
                const helmGearItem = this.generateGearItem(
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
                        botLevel,
                        botRole,
                        botInventory,
                        EquipmentSlots.EARPIECE
                    );
                }
            }

            this.generateArmor(botLevel, botRole, botInventory);

            this.generateGearItem(
                botLevel,
                botRole,
                botInventory,
                EquipmentSlots.EYEWEAR
            );
        }
        this.generateGearItem(
            botLevel,
            botRole,
            botInventory,
            EquipmentSlots.BACKPACK
        );
        this.generateGearItem(
            botLevel,
            botRole,
            botInventory,
            EquipmentSlots.FACE_COVER
        );

        const generatedWeapon = this.weaponGenerator.generateWeapon(
            botLevel,
            botInventory.equipment,
            raidInfo.isNight
        );

        botInventory.items.push(...generatedWeapon.weaponWithMods);

        this.weaponGenerator.addExtraMagazinesToInventory(
            generatedWeapon,
            botInventory
        );

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
        botInventory: PmcInventory
    ): undefined {
        this.nightHeadwear.generateNightHeadwear(botLevel, botInventory);
    }
}
