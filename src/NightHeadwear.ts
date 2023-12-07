import { inject, injectable } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";
import { BotGeneratorHelper } from "@spt-aki/helpers/BotGeneratorHelper";

const NVG_SLOT_ID = "mod_nvg";

const _6B47_RATNIK_BSH_HELMET = "5a7c4850e899ef00150be885";
const MSA_ACH_TC_2001_MICH_SERIES_HELMET = "5d5e7d28a4b936645d161203";
const PNV_10T_NIGHT_VISION_GOGGLES = "5c0696830db834001d23f5da";
const NOROTOS_TITANIUM_ADVANCED_TACTICAL_MOUNT = "5a16b8a9fcdbcb00165aa6ca";
const PNV_10T_DOVETAIL_ADAPTER = "5c0695860db834001b735461";

const CRYE_PRECISION_AIRFRAME_HELMET_TAN = "5c17a7ed2e2216152142459c";
const OPS_CORE_FAST_MT_SUPER_HIGH_CUT_HELMET = "5a154d5cfcdbcb001a3b00da";
const GPNVG_18_NIGHT_VISION_GOGGLES = "5c0558060db834001b735271";

@injectable()
export class NightHeadwear {
    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("BotGeneratorHelper")
        protected botGeneratorHelper: BotGeneratorHelper
    ) {
        this.logger.info("[Andern] PMC Bot Headwear Changes enabled");
    }

    tierOneHeadwearWithNvg(
        botRole: string,
        pmcInventory: PmcInventory
    ): undefined {
        const [items, headwearId] = this.replaceHeadwear(
            pmcInventory.items,
            _6B47_RATNIK_BSH_HELMET,
            botRole
        );
        this.addTierTwoNightVision(items, headwearId);
        pmcInventory.items = items;
    }

    tierTwoHeadwearWithNvg(
        botRole: string,
        pmcInventory: PmcInventory
    ): undefined {
        const [items, headwearId] = this.replaceHeadwear(
            pmcInventory.items,
            MSA_ACH_TC_2001_MICH_SERIES_HELMET,
            botRole
        );
        this.addTierTwoNightVision(items, headwearId);
        pmcInventory.items = items;
    }

    tierThreeHeadwearWithNvg(
        botRole: string,
        pmcInventory: PmcInventory
    ): undefined {
        const [items, headwearId] = this.replaceHeadwear(
            pmcInventory.items,
            OPS_CORE_FAST_MT_SUPER_HIGH_CUT_HELMET,
            botRole
        );
        this.addNightVision(items, headwearId, GPNVG_18_NIGHT_VISION_GOGGLES);
        pmcInventory.items = items;
    }

    tierFourHeadwearWithNvg(
        botRole: string,
        pmcInventory: PmcInventory
    ): undefined {
        const [items, headwearId] = this.replaceHeadwear(
            pmcInventory.items,
            CRYE_PRECISION_AIRFRAME_HELMET_TAN,
            botRole
        );
        this.addNightVision(items, headwearId, GPNVG_18_NIGHT_VISION_GOGGLES);
        pmcInventory.items = items;
    }

    replaceHeadwear(
        inventoryItems: Item[],
        headwearTemplateId: string,
        botRole: string
    ): [Item[], string] {
        const rootId = inventoryItems[0]._id;
        const items = this.deleteHeadwear(inventoryItems);
        const headwearId = this.addHeadwear(
            items,
            rootId,
            headwearTemplateId,
            botRole
        );
        return [items, headwearId];
    }

    findItemToDelete(items: Item[], parentId: string): Item {
        for (const item of items) {
            if (item.parentId && item.parentId == parentId) {
                return item;
            } else {
                return null;
            }
        }
    }

    deleteHeadwear(inventoryItems: Item[]): Item[] {
        const itemsToDelete: Item[] = [];

        for (const item of inventoryItems) {
            if (item.slotId && item.slotId === EquipmentSlots.HEADWEAR) {
                const headwearId = item._id;
                itemsToDelete.push(item);

                let itemToDelete = this.findItemToDelete(
                    inventoryItems,
                    headwearId
                );
                while (itemToDelete != null) {
                    itemsToDelete.push(item);
                    itemToDelete = this.findItemToDelete(
                        inventoryItems,
                        itemToDelete._id
                    );
                }
            }
        }

        const filteredItems = inventoryItems
            .filter((i) => {
                if (i.slotId) return i.slotId !== EquipmentSlots.FACE_COVER;
                else return true;
            })
            .filter((i) => !itemsToDelete.includes(i));

        return filteredItems;
    }

    addHeadwear(
        items: Item[],
        rootId: string,
        equipmentItemTpl: string,
        botRole: string
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
                `[Andern] wrong template id ${equipmentItemTpl} for slot HEADWEAR`
            );
        }

        const headwearItem: Item = {
            _id: id,
            _tpl: equipmentItemTpl,
            parentId: rootId,
            slotId: EquipmentSlots.HEADWEAR,
            ...extraProps,
        };

        items.push(headwearItem);
        return id;
    }

    addNightVision(
        items: Item[],
        headwearId: string,
        timplateId: string
    ): string {
        const nvgItem: Item = {
            _id: this.hashUtil.generate(),
            _tpl: timplateId,
            parentId: headwearId,
            slotId: NVG_SLOT_ID,
            upd: {
                StackObjectsCount: 1,
            },
        };

        items.push(nvgItem);
        return nvgItem._id;
    }

    addTierTwoNightVision(items: Item[], headwearId: string): undefined {
        const mountId = this.addNightVision(
            items,
            headwearId,
            NOROTOS_TITANIUM_ADVANCED_TACTICAL_MOUNT
        );
        const adapterId = this.addNightVision(
            items,
            mountId,
            PNV_10T_DOVETAIL_ADAPTER
        );
        this.addNightVision(items, adapterId, PNV_10T_NIGHT_VISION_GOGGLES);
    }

    public generateNightHeadwear(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        if (botLevel < 15) {
            this.tierOneHeadwearWithNvg(botRole, botInventory);
        } else if (botLevel >= 15 && botLevel < 28) {
            this.tierTwoHeadwearWithNvg(botRole, botInventory);
        } else if (botLevel >= 28 && botLevel < 40) {
            this.tierThreeHeadwearWithNvg(botRole, botInventory);
        } else {
            this.tierFourHeadwearWithNvg(botRole, botInventory);
        }
    }
}
