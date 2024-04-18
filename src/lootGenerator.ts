import { inject, injectable } from "tsyringe";

import { RaidInfo } from './RaidInfo';
import { HashUtil } from '@spt-aki/utils/HashUtil';
import { BotLootGenerator } from "@spt-aki/generators/BotLootGenerator";
import { RandomUtil } from '@spt-aki/utils/RandomUtil';
import { WeightedRandomHelper } from "@spt-aki/helpers/WeightedRandomHelper";
import { mapPmcBackpackLootData, mapPmcBackpackLootDataGroup  } from "./models";
import { combineGlobalItemListIntoArray, combineMapItemListIntoArray } from "./lootGeneratorHelper";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { InventoryHelper } from "@spt-aki/helpers/InventoryHelper";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { HandbookHelper } from "@spt-aki/helpers/HandbookHelper";
import { BotGeneratorHelper } from "@spt-aki/helpers/BotGeneratorHelper";
import { BotWeaponGenerator } from "@spt-aki/generators/BotWeaponGenerator";
import { BotHelper } from "@spt-aki/helpers/BotHelper";
import { BotLootCacheService } from "@spt-aki/services/BotLootCacheService";
import { LocalisationService } from "@spt-aki/services/LocalisationService";

import { Inventory as pmcInventory } from '@spt-aki/models/eft/common/tables/IBotBase';
import { IBotType } from "@spt-aki/models/eft/common/tables/IBotType";
import { ILogger } from '@spt-aki/models/spt/utils/ILogger';
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";
import { LootCacheType } from "@spt-aki/models/spt/bots/IBotLootCache";
import { ItemAddedResult } from "@spt-aki/models/enums/ItemAddedResult";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";

import * as config from "../config/config.json";
import * as backpackLootConfig from '../config/backpack_config.json';

@injectable()
export class LootGenerator extends BotLootGenerator {
    constructor(
        @inject("WinstonLogger") logger: ILogger,
        @inject("HashUtil") hashUtil: HashUtil,
        @inject("RandomUtil") randomUtil: RandomUtil,
        @inject("ItemHelper") itemHelper: ItemHelper,
        @inject("JsonUtil") jsonUtil: JsonUtil,
        @inject("InventoryHelper") inventoryHelper: InventoryHelper,
        @inject("DatabaseServer") databaseServer: DatabaseServer,
        @inject("HandbookHelper") handbookHelper: HandbookHelper,
        @inject("BotGeneratorHelper") botGeneratorHelper: BotGeneratorHelper,
        @inject("BotWeaponGenerator") botWeaponGenerator: BotWeaponGenerator,
        @inject("WeightedRandomHelper") weightedRandomHelper: WeightedRandomHelper,
        @inject("BotHelper") botHelper: BotHelper,
        @inject("BotLootCacheService") botLootCacheService: BotLootCacheService,
        @inject("LocalisationService") localisationService: LocalisationService,
        @inject("ConfigServer") configServer: ConfigServer,
    ) {
        super(
            logger, hashUtil, randomUtil,
            itemHelper, jsonUtil, inventoryHelper,
            databaseServer, handbookHelper, botGeneratorHelper,
            botWeaponGenerator, weightedRandomHelper, botHelper,
            botLootCacheService, localisationService, configServer
        );
    }

    public override generateLoot(sessionId: string, botJsonTemplate: IBotType, isPmc: boolean, botRole: string, botInventory: pmcInventory, botLevel: number, raidInfo?: RaidInfo): void {
        if (!isPmc || !config.pmcBackpackLoot) {
            return super.generateLoot(sessionId, botJsonTemplate, isPmc, botRole, botInventory, botLevel);
        }

        const itemCounts = botJsonTemplate.generation.items;

        const pocketLootCount = Number(
            this.weightedRandomHelper.getWeightedValue<number>(itemCounts.pocketLoot.weights),
        );
        const vestLootCount = Number(
            this.weightedRandomHelper.getWeightedValue<number>(itemCounts.vestLoot.weights),
        );
        const speicalLootCount = Number(
            this.weightedRandomHelper.getWeightedValue<number>(itemCounts.specialItems.weights),
        );
        const healingItemCount = Number(
            this.weightedRandomHelper.getWeightedValue<number>(itemCounts.healing.weights),
        );
        const drugItemCount = Number(
            this.weightedRandomHelper.getWeightedValue<number>(itemCounts.drugs.weights),
        );
        const stimItemCount = Number(this.weightedRandomHelper.getWeightedValue<number>(itemCounts.stims.weights));
        const grenadeItemCount = Number(this.weightedRandomHelper.getWeightedValue<number>(itemCounts.grenades.weights));

        if (isPmc && this.pmcConfig.forceHealingItemsIntoSecure) {
            this.addForcedMedicalItemsToPmcSecure(botInventory, botRole);
        }

        const botItemLimits = this.getItemSpawnLimitsForBot(botRole);

        const containersBotHasAvailable = this.getAvailableContainersBotCanStoreItemsIn(botInventory);

        // Speical items
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.SPECIAL, botJsonTemplate),
            containersBotHasAvailable,
            speicalLootCount,
            botInventory,
            botRole,
            botItemLimits
        );

        // Healing items
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.HEALING_ITEMS, botJsonTemplate),
            containersBotHasAvailable,
            healingItemCount,
            botInventory,
            botRole,
            null,
            0,
            isPmc
        );

        // Drugs
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.DRUG_ITEMS, botJsonTemplate),
            containersBotHasAvailable,
            drugItemCount,
            botInventory,
            botRole,
            null,
            0,
            isPmc
        );

        // Stims
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.STIM_ITEMS, botJsonTemplate),
            containersBotHasAvailable,
            stimItemCount,
            botInventory,
            botRole,
            botItemLimits,
            0,
            isPmc
        );

        // Grenades
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.GRENADE_ITEMS, botJsonTemplate),
            containersBotHasAvailable,
            grenadeItemCount,
            botInventory,
            botRole,
            null,
            0,
            isPmc
        );

        // Backpack
        this.generateBackpackLoot(sessionId, botLevel, botRole, botInventory, botJsonTemplate, isPmc, raidInfo);

        // Tatical vestLoot
        if (containersBotHasAvailable.includes(EquipmentSlots.TACTICAL_VEST)) {
            this.addLootFromPool(
                this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.VEST, botJsonTemplate),
                [EquipmentSlots.TACTICAL_VEST],
                vestLootCount,
                botInventory,
                botRole,
                botItemLimits,
                this.pmcConfig.maxVestLootTotalRub,
                isPmc
            );
        }

        // Pockets
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.POCKET, botJsonTemplate),
            [EquipmentSlots.POCKETS],
            pocketLootCount,
            botInventory,
            botRole,
            botItemLimits,
            this.pmcConfig.maxPocketLootTotalRub,
            isPmc
        )

        // Secure
        this.addLootFromPool(
            this.botLootCacheService.getLootFromCache(botRole, isPmc, LootCacheType.SECURE, botJsonTemplate),
            [EquipmentSlots.SECURED_CONTAINER],
            50,
            botInventory,
            botRole,
            null,
            -1,
            isPmc
        )
    }

    protected generateBackpackLoot(sessionId: string, botLevel: number, botRole: string, botInventory: pmcInventory,botJsonTemplate: IBotType,  isPmc: boolean, raidInfo: RaidInfo) {
        const mapLootTable = this.getMapData(raidInfo);
        const globalLootTableAvailable = backpackLootConfig.global.weights.length > 0;
        let selectedLootDataForBot: mapPmcBackpackLootData;

        if (mapLootTable && isPmc) {
            selectedLootDataForBot = this.getBotLootData(botLevel, mapLootTable);
        }

        let backpackLootCount = config.pmcBackpackLoot && isPmc && selectedLootDataForBot ?
            this.randomUtil.getInt(selectedLootDataForBot.min_items, selectedLootDataForBot.max_items) :
            this.weightedRandomHelper.getWeightedValue<number>(botJsonTemplate.generation.items.backpackLoot.weights);

        const containersBotHasAvailable = this.getAvailableContainersBotCanStoreItemsIn(botInventory);
        const canAddBackpackLoot = containersBotHasAvailable.includes(EquipmentSlots.BACKPACK) && !config.disableBotBackpackLoot;
        const canUseCustomBackpackLoot = mapLootTable || globalLootTableAvailable;

        if (!canAddBackpackLoot || !canUseCustomBackpackLoot) {
            return;
        }

        const canAddWeaponsToBackpack = backpackLootConfig.include_weapons && this.randomUtil.getChance100(this.pmcConfig.looseWeaponInBackpackChancePercent);

        if (canAddWeaponsToBackpack) {
            this.addLooseWeaponsToInventorySlot(
                sessionId,
                botInventory,
                EquipmentSlots.BACKPACK,
                botJsonTemplate.inventory,
                botJsonTemplate.chances.weaponMods,
                botRole,
                isPmc,
                botLevel
            )
        }

        //Keycards and rare keys
        //TODO -- keycard and rare keys should have weights attached to them
        const shouldAddKeycard = this.randomUtil.getChance100((selectedLootDataForBot?.keycard_chance || backpackLootConfig.global.keycard_chance) * 100);
        const shouldAddRareKey = this.randomUtil.getChance100((selectedLootDataForBot?.rare_key_chance || backpackLootConfig.global.rare_key_chance) * 100);

        if (shouldAddKeycard) {
            const keycardTpl = this.randomUtil.getArrayValue(this.randomUtil.shuffle(backpackLootConfig.loot_tables.keycards));
            this.addLootFromPool(
                {[keycardTpl]: 1},
                [EquipmentSlots.BACKPACK],
                1,
                botInventory,
                botRole,
                null,
                -1,
                isPmc
            );
            backpackLootCount--;
        }

        if (shouldAddRareKey) {
            const rareKeyTpl = this.randomUtil.getArrayValue(this.randomUtil.shuffle(backpackLootConfig.loot_tables.rare_keys));
            this.addLootFromPool(
                {[rareKeyTpl]: 1},
                [EquipmentSlots.BACKPACK],
                1,
                botInventory,
                botRole,
                null,
                -1,
                isPmc
            );
            backpackLootCount--;
        }

        if (mapLootTable) {
            const combinedLootTable = combineMapItemListIntoArray(selectedLootDataForBot);
            const itemTplsAdded: Record<string, number> = {};

            this.addLootFromList(
                this.getBackpackLootItemList(combinedLootTable, selectedLootDataForBot.weights, backpackLootCount, itemTplsAdded),
                [EquipmentSlots.BACKPACK],
                botInventory,
                botRole,
                isPmc
            );

            return;
        }

        if (globalLootTableAvailable && backpackLootCount > 0) {
            const combinedLootTable = combineGlobalItemListIntoArray();
            const itemTplsAdded: Record<string, number> = {};

            this.addLootFromList(
                this.getBackpackLootItemList(combinedLootTable, backpackLootConfig.global.weights, backpackLootCount, itemTplsAdded),
                [EquipmentSlots.BACKPACK],
                botInventory,
                botRole,
                isPmc
            );
        }
    }

    protected getMapData(raidInfo: RaidInfo): mapPmcBackpackLootDataGroup | null {
        if (Object.prototype.hasOwnProperty.call(backpackLootConfig.custom_map_loot_tables, raidInfo.location)) {
            return backpackLootConfig.custom_map_loot_tables[raidInfo.location];
        }

        return null;
    }

    protected getBotLootData(botLevel: number, lootTableGroups: mapPmcBackpackLootDataGroup): mapPmcBackpackLootData {
        return lootTableGroups.find((group) => botLevel >= group.min_level && botLevel <= group.max_level);
    }

    protected getBackpackLootItem(lootTableArray: string[][], weights: number[], botAddedBackpackItems: Record<string, number>): string {
        const selectedLootTable = this.weightedRandomHelper.weightedRandom(lootTableArray, weights);

        let selectedItemTpl: string = this.randomUtil.getArrayValue(this.randomUtil.shuffle(selectedLootTable.item));

        while (Object.prototype.hasOwnProperty.call(botAddedBackpackItems, selectedItemTpl) && botAddedBackpackItems[selectedItemTpl] >= backpackLootConfig.duplicate_item_limit) {
            selectedItemTpl = this.randomUtil.getArrayValue(this.randomUtil.shuffle(selectedLootTable.item));
        }

        if (!Object.prototype.hasOwnProperty.call(botAddedBackpackItems, selectedItemTpl)) {
            botAddedBackpackItems[selectedItemTpl] = 1;
        }

        if (Object.prototype.hasOwnProperty.call(botAddedBackpackItems, selectedItemTpl)) {
            botAddedBackpackItems[selectedItemTpl]++;
        }

        return selectedItemTpl;
    }

    protected getBackpackLootItemList(lootTableArray: string[][], weights: number[], amountToAdd: number, botAddedBackpackItems: Record<string, number>): string[] {
        return Array.from({length: amountToAdd}, () => "").map(() => this.getBackpackLootItem(lootTableArray, weights, botAddedBackpackItems))
    }

    protected addLootFromList(
        itemList: string[],
        equipmentSlots: string[],
        inventoryToAddItemsTo: pmcInventory,
        botRole: string,
        isPmc: boolean
    ) {
        const itemListSize = itemList.length;

        if (itemListSize > 0) {
            let fitItemIntoContainerAttempts = 0;
            for (let i = 0; i < itemListSize; i++) {
                if (itemList.length === 0) {
                    return;
                }

                const itemTpl = itemList.shift();
                const item = this.itemHelper.getItem(itemTpl);
                const itemToAddTemplate = item[1];

                if (!item[0]) {
                    this.logger.warning(
                        `Unable to process item tpl: ${itemTpl} for slots: ${equipmentSlots} on bot: ${botRole}`,
                    );

                    continue;
                }

                const newRootItemId = this.hashUtil.generate();
                const itemWithChildrenToAdd: Item[] = [{
                    _id: newRootItemId,
                    _tpl: itemToAddTemplate._id,
                    ...this.botGeneratorHelper.generateExtraPropertiesForItem(itemToAddTemplate, botRole)
                }];

                if (this.botConfig.walletLoot.walletTplPool.includes(itemTpl)) {
                    const addCurrencyToWallet = this.randomUtil.getChance100(this.botConfig.walletLoot.chancePercent);
                    if (addCurrencyToWallet) {
                        const itemsToAdd = this.createWalletLoot(newRootItemId);

                        const containerGrid = this.inventoryHelper.getContainerSlotMap(itemTpl);

                        const canAddToContainer = this.inventoryHelper.canPlaceItemsInContainer(
                            this.jsonUtil.clone(containerGrid),
                            itemsToAdd
                        )

                        if (canAddToContainer) {
                            for (const itemToAdd of itemsToAdd) {
                                this.inventoryHelper.placeItemInContainer(
                                    containerGrid,
                                    itemToAdd,
                                    itemWithChildrenToAdd[0]._id,
                                    "main",
                                );
                            }
                        }
                    }
                }

                this.addRequiredChildItemsToParent(itemToAddTemplate, itemWithChildrenToAdd, isPmc, botRole);

                const itemAddedResult = this.botGeneratorHelper.addItemWithChildrenToEquipmentSlot(
                    equipmentSlots,
                    newRootItemId,
                    itemToAddTemplate._id,
                    itemWithChildrenToAdd,
                    inventoryToAddItemsTo
                );

                if (itemAddedResult !== ItemAddedResult.SUCCESS) {
                    if (itemAddedResult === ItemAddedResult.NO_CONTAINERS) {
                        this.logger.debug(
                            `Unable to add: ${itemListSize} items to bot as it lacks a container to include them`,
                        );
                        break;
                    }

                    fitItemIntoContainerAttempts++;
                    if (fitItemIntoContainerAttempts >= 4) {
                        this.logger.debug(
                            `Failed to place item ${i} of ${itemListSize} items into ${botRole} containers: ${equipmentSlots.join(",")}
                            Tried ${fitItemIntoContainerAttempts} times, reason: ${ItemAddedResult[itemAddedResult]}, skipping`
                        );

                        // Orignal method breaks here, but the next item could fit
                        fitItemIntoContainerAttempts = 0;
                        continue;
                    }
                    itemList.unshift(itemTpl); // Add item back into item list
                    i--;
                    continue;
                }

                fitItemIntoContainerAttempts = 0;
            }
        }
    }
}
