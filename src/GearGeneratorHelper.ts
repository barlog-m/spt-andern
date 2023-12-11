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
}
