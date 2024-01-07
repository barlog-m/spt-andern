import { inject, injectable } from "tsyringe";

import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { BotGeneratorHelper } from "@spt-aki/helpers/BotGeneratorHelper";

@injectable()
export class GearGeneratorHelper {
    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("BotGeneratorHelper")
        protected botGeneratorHelper: BotGeneratorHelper
    ) {}

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
}
