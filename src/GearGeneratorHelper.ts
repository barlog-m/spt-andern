import {inject, injectable} from "tsyringe";

import {ILogger} from "@spt-aki/models/spt/utils/ILogger";
import {HashUtil} from "@spt-aki/utils/HashUtil";
import {RandomUtil} from "@spt-aki/utils/RandomUtil";
import {
    Inventory as PmcInventory
} from "@spt-aki/models/eft/common/tables/IBotBase";
import {EquipmentSlots} from "@spt-aki/models/enums/EquipmentSlots";
import {ItemHelper} from "@spt-aki/helpers/ItemHelper";
import {BotGeneratorHelper} from "@spt-aki/helpers/BotGeneratorHelper";
import {DatabaseServer} from "@spt-aki/servers/DatabaseServer";
import {Data} from "./Data";
import {Mods as PmcMods} from "@spt-aki/models/eft/common/tables/IBotType";
import {Mods} from "./models";

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
        equipmentItemTpl: string
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
            this.addNecessaryMods(botRole, botInventory, equipmentItemTpl, id);
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

    addNecessaryMods(botRole: string,
                     botInventory: PmcInventory,
                     tpl: string,
                     id: string): undefined {
        if (this.modsData === undefined) {
            this.setModsData();
        }
        const mods: Mods = this.modsData[tpl];

        if (mods === undefined) {
            return;
        }

        Object.entries(mods).forEach(([modSlot, modsArray]) => {
            if (this.necessaryModSlots.includes(modSlot.toLowerCase())) {
                const keys = Object.keys(modsArray);
                const randomKey = this.randomUtil.getArrayValue(keys);
                const selectedMod = modsArray[randomKey];
                this.putModItemToInventory(botRole, botInventory, selectedMod, modSlot, id)
            }
        })
    }
}
