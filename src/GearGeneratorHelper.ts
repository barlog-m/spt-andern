import {inject, injectable} from "tsyringe";

import {ILogger} from "@spt/models/spt/utils/ILogger";
import {HashUtil} from "@spt/utils/HashUtil";
import {RandomUtil} from "@spt/utils/RandomUtil";
import {
    Inventory as PmcInventory
} from "@spt/models/eft/common/tables/IBotBase";
import {EquipmentSlots} from "@spt/models/enums/EquipmentSlots";
import {ItemHelper} from "@spt/helpers/ItemHelper";
import {BotGeneratorHelper} from "@spt/helpers/BotGeneratorHelper";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {Data} from "./Data";
import {Mods as PmcMods} from "@spt/models/eft/common/tables/IBotType";
import {GearItem, Mods} from "./models";

@injectable()
export class GearGeneratorHelper {
    readonly necessaryModSlots = [
        "helmet_top",
        "helmet_back",
        "helmet_ears",
        "front_plate",
        "back_plate",
        "left_side_plate",
        "right_side_plate",
        "groin",
        "groin_back",
        "collar",
        "shoulder_l",
        "shoulder_r",
        "soft_armor_front",
        "soft_armor_back",
        "soft_armor_left",
        "soft_armor_right"
    ]

    readonly weightedModSlots = [
        "front_plate",
        "back_plate",
        "left_side_plate",
        "right_side_plate"
    ]

    readonly platesWeights = {
        "one": {
            3: 60,
            4: 40,
            5: 0,
            6: 0
        },
        "two": {
            3: 20,
            4: 80,
            5: 0,
            6: 0
        },
        "three": {
            3: 0,
            4: 40,
            5: 50,
            6: 10
        },
        "four": {
            3: 0,
            4: 20,
            5: 50,
            6: 30
        },
    }

    modsData: PmcMods;

    setModsData(): undefined {
        const tables = this.databaseServer.getTables();
        this.modsData = tables.bots.types["usec"].inventory.mods
    }

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("BotGeneratorHelper")
        protected botGeneratorHelper: BotGeneratorHelper,
        @inject("DatabaseServer")
        protected databaseServer: DatabaseServer,
        @inject("AndernData") protected data: Data
    ) {
    }

    public putGearItemToInventory(
        equipmentSlot: EquipmentSlots,
        botRole: string,
        botInventory: PmcInventory,
        equipmentItemTpl: string,
        useWeights: boolean,
        botLevel: number
    ): string {
        const id = this.hashUtil.generate();

        const [isItemExists, itemTemplate] =
            this.itemHelper.getItem(equipmentItemTpl);
        if (!isItemExists) {
            this.logger.error(
                `[Andern] wrong template id ${equipmentItemTpl} for slot ${equipmentSlot}`
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

        if (equipmentSlot === EquipmentSlots.HEADWEAR ||
            equipmentSlot === EquipmentSlots.ARMOR_VEST ||
            equipmentSlot === EquipmentSlots.TACTICAL_VEST
        ) {
            this.addNecessaryMods(botRole, botInventory, equipmentItemTpl, id, useWeights, botLevel);
        }

        botInventory.items.push(item);
        return id;
    }

    public putModItemToInventory(
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
                `[Andern] wrong template id ${equipmentItemTpl} for slot ${slotId}`
            );
        }

        const item = {
            _id: id,
            _tpl: equipmentItemTpl,
            parentId,
            slotId,
            ...this.botGeneratorHelper.generateExtraPropertiesForItem(
                itemTemplate,
                botRole
            ),
        };

        if (item.upd?.Togglable?.On !== undefined) {
            item.upd.Togglable.On = true;
        }

        botInventory.items.push(item);
        return id;
    }

    public replaceEarpiece(tpl: string): string {
        // "GSSh-01 active headset" -> "OPSMEN Earmor M32 headset"
        if (tpl === "5b432b965acfc47a8774094e") {
            return "6033fa48ffd42c541047f728";
        }

        // "Peltor ComTac 2 headset" -> "OPSMEN Earmor M32 headset"
        if (tpl === "5645bcc04bdc2d363b8b4572") {
            return "6033fa48ffd42c541047f728";
        }

        // "Peltor Tactical Sport headset" -> "OPSMEN Earmor M32 headset"
        if (tpl === "5c165d832e2216398b5a7e36") {
            return "6033fa48ffd42c541047f728";
        }

        // "MSA Sordin Supreme PRO-X/L active headset" -> "Walker's XCEL 500BT Digital headset"
        if (tpl === "5aa2ba71e5b5b000137b758f") {
            return "5f60cd6cf2bcbb675b00dac6";
        }

        // "Walkers Razor Digital headset" -> "Walker's XCEL 500BT Digital headset"
        if (tpl === "5e4d34ca86f774264f758330") {
            return "5f60cd6cf2bcbb675b00dac6";
        }

        return tpl;
    }

    addNecessaryMods(
        botRole: string,
        botInventory: PmcInventory,
        tpl: string,
        id: string,
        useWeights: boolean,
        botLevel: number
    ): undefined {
        if (this.modsData === undefined) {
            this.setModsData();
        }

        const mods: Mods = this.modsData[tpl];

        if (mods === undefined) {
            return;
        }

        Object.entries(mods).forEach(([modSlot, modsArray]) => {
            const modSlotName = modSlot.toLowerCase();
            let selectedModTpl: string;
            if (this.necessaryModSlots.includes(modSlotName)) {

                if (useWeights && this.weightedModSlots.includes(modSlotName)) {
                    const plateWeights = this.plateWeightsByLevel(botLevel);

                    const plateItems: GearItem[] = modsArray
                        .map((tpl) => [tpl, this.data.getPlateArmorClassByPlateTpl(tpl)])
                        .map(([tpl, armorClass]) => {
                            return {
                                weight: plateWeights[armorClass],
                                id: tpl as string,
                                name: ""
                            }
                        });

                    selectedModTpl = this.weightedRandomGearItem(plateItems).id;

                } else {
                    const keys = Object.keys(modsArray);
                    const randomKey = this.randomUtil.getArrayValue(keys);
                    selectedModTpl = modsArray[randomKey];
                }

                this.putModItemToInventory(botRole, botInventory, selectedModTpl, modSlot, id)
            }
        })
    }

    plateWeightsByLevel(level: number): Record<number, number> {
        if (level < 15) {
            return this.platesWeights.one;
        } else if (level >= 15 && level < 32) {
            return this.platesWeights.two;
        } else if (level >= 32 && level < 42) {
            return this.platesWeights.three;
        } else {
            return this.platesWeights.four;
        }
    }

    public weightedRandomGearItem(items: GearItem[]): GearItem {
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
}
