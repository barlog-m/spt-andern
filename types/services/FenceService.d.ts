import { HandbookHelper } from "@spt-aki/helpers/HandbookHelper";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { PresetHelper } from "@spt-aki/helpers/PresetHelper";
import { MinMax } from "@spt-aki/models/common/MinMax";
import { IFenceLevel } from "@spt-aki/models/eft/common/IGlobals";
import { IPmcData } from "@spt-aki/models/eft/common/IPmcData";
import { Item, Repairable } from "@spt-aki/models/eft/common/tables/IItem";
import { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { ITraderAssort } from "@spt-aki/models/eft/common/tables/ITrader";
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ItemFilterService } from "@spt-aki/services/ItemFilterService";
import { LocalisationService } from "@spt-aki/services/LocalisationService";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { TimeUtil } from "@spt-aki/utils/TimeUtil";
/**
 * Handle actions surrounding Fence
 * e.g. generating or refreshing assorts / get next refresh time
 */
export declare class FenceService {
    protected logger: ILogger;
    protected hashUtil: HashUtil;
    protected jsonUtil: JsonUtil;
    protected timeUtil: TimeUtil;
    protected randomUtil: RandomUtil;
    protected databaseServer: DatabaseServer;
    protected handbookHelper: HandbookHelper;
    protected itemHelper: ItemHelper;
    protected presetHelper: PresetHelper;
    protected itemFilterService: ItemFilterService;
    protected localisationService: LocalisationService;
    protected configServer: ConfigServer;
    /** Main assorts you see at all rep levels */
    protected fenceAssort: ITraderAssort;
    /** Assorts shown on a separate tab when you max out fence rep */
    protected fenceDiscountAssort: ITraderAssort;
    protected traderConfig: ITraderConfig;
    protected nextMiniRefreshTimestamp: number;
    constructor(logger: ILogger, hashUtil: HashUtil, jsonUtil: JsonUtil, timeUtil: TimeUtil, randomUtil: RandomUtil, databaseServer: DatabaseServer, handbookHelper: HandbookHelper, itemHelper: ItemHelper, presetHelper: PresetHelper, itemFilterService: ItemFilterService, localisationService: LocalisationService, configServer: ConfigServer);
    /**
     * Replace main fence assort with new assort
     * @param assort New assorts to replace old with
     */
    setFenceAssort(assort: ITraderAssort): void;
    /**
     * Replace high rep level fence assort with new assort
     * @param discountAssort New assorts to replace old with
     */
    setFenceDiscountAssort(discountAssort: ITraderAssort): void;
    /**
     * Get assorts player can purchase
     * Adjust prices based on fence level of player
     * @param pmcProfile Player profile
     * @returns ITraderAssort
     */
    getFenceAssorts(pmcProfile: IPmcData): ITraderAssort;
    /**
     * Adjust all items contained inside an assort by a multiplier
     * @param assort (clone)Assort that contains items with prices to adjust
     * @param itemMultipler multipler to use on items
     * @param presetMultiplier preset multipler to use on presets
     */
    protected adjustAssortItemPrices(assort: ITraderAssort, itemMultipler: number, presetMultiplier: number): void;
    /**
     * Merge two trader assort files together
     * @param firstAssort assort 1#
     * @param secondAssort  assort #2
     * @returns merged assort
     */
    protected mergeAssorts(firstAssort: ITraderAssort, secondAssort: ITraderAssort): ITraderAssort;
    /**
     * Adjust assorts price by a modifier
     * @param item assort item details
     * @param assort assort to be modified
     * @param modifier value to multiply item price by
     * @param presetModifier value to multiply preset price by
     */
    protected adjustItemPriceByModifier(item: Item, assort: ITraderAssort, modifier: number, presetModifier: number): void;
    /**
     * Get fence assorts with no price adjustments based on fence rep
     * @returns ITraderAssort
     */
    getRawFenceAssorts(): ITraderAssort;
    /**
     * Does fence need to perform a partial refresh because its passed the refresh timer defined in trader.json
     * @returns true if it needs a partial refresh
     */
    needsPartialRefresh(): boolean;
    /**
     * Replace a percentage of fence assorts with freshly generated items
     */
    performPartialRefresh(): void;
    /**
     * Increment fence next refresh timestamp by current timestamp + partialRefreshTimeSeconds from config
     */
    protected incrementPartialRefreshTime(): void;
    /**
     * Compare the current fence offer count to what the config wants it to be,
     * If value is lower add extra count to value to generate more items to fill gap
     * @param existingItemCountToReplace count of items to generate
     * @returns number of items to generate
     */
    protected getCountOfItemsToGenerate(existingItemCountToReplace: number): number;
    /**
     * Choose an item (not mod) at random and remove from assorts
     * @param assort Items to remove from
     */
    protected removeRandomItemFromAssorts(assort: ITraderAssort): void;
    /**
     * Get an integer rounded count of items to replace based on percentrage from traderConfig value
     * @param totalItemCount total item count
     * @returns rounded int of items to replace
     */
    protected getCountOfItemsToReplace(totalItemCount: number): number;
    /**
     * Get the count of items fence offers
     * @returns number
     */
    getOfferCount(): number;
    /**
     * Create trader assorts for fence and store in fenceService cache
     * Uses fence base cache generatedon server start as a base
     */
    generateFenceAssorts(): void;
    /**
     * Create skeleton to hold assort items
     * @returns ITraderAssort object
     */
    protected createFenceAssortSkeleton(): ITraderAssort;
    /**
     * Hydrate assorts parameter object with generated assorts
     * @param assortCount Number of assorts to generate
     * @param assorts object to add created assorts to
     */
    protected createAssorts(assortCount: number, assorts: ITraderAssort, loyaltyLevel: number): void;
    protected addItemAssorts(assortCount: number, assorts: ITraderAssort, fenceAssort: ITraderAssort, itemTypeCounts: Record<string, {
        current: number;
        max: number;
    }>, loyaltyLevel: number): void;
    /**
     * Find presets in base fence assort and add desired number to 'assorts' parameter
     * @param desiredPresetCount
     * @param assorts
     * @param baseFenceAssort
     * @param loyaltyLevel Which loyalty level is required to see/buy item
     */
    protected addPresetsToAssort(desiredPresetCount: number, assorts: ITraderAssort, baseFenceAssort: ITraderAssort, loyaltyLevel: number): void;
    /**
     * Adjust plate / soft insert durability values
     * @param armor Armor item array to add mods into
     * @param itemDbDetails Armor items db template
     */
    protected randomiseArmorModDurability(armor: Item[], itemDbDetails: ITemplateItem): void;
    /**
     * Get stack size of a singular item (no mods)
     * @param itemDbDetails item being added to fence
     * @returns Stack size
     */
    protected getSingleItemStackCount(itemDbDetails: ITemplateItem): number;
    /**
     * Remove parts of a weapon prior to being listed on flea
     * @param itemAndMods Weapon to remove parts from
     */
    protected removeRandomModsOfItem(itemAndMods: Item[]): void;
    /**
     * Roll % chance check to see if item should be removed
     * @param weaponMod Weapon mod being checked
     * @param itemsBeingDeleted Current list of items on weapon being deleted
     * @returns True if item will be removed
     */
    protected presetModItemWillBeRemoved(weaponMod: Item, itemsBeingDeleted: string[]): boolean;
    /**
     * Randomise items' upd properties e.g. med packs/weapons/armor
     * @param itemDetails Item being randomised
     * @param itemToAdjust Item being edited
     */
    protected randomiseItemUpdProperties(itemDetails: ITemplateItem, itemToAdjust: Item): void;
    /**
     * Generate a randomised current and max durabiltiy value for an armor item
     * @param itemDetails Item to create values for
     * @param maxDurabilityMinMaxPercent Max durabiltiy percent min/max values
     * @returns Durability + MaxDurability values
     */
    protected getRandomisedArmorDurabilityValues(itemDetails: ITemplateItem, maxDurabilityMinMaxPercent: MinMax): Repairable;
    /**
     * Construct item limit record to hold max and current item count
     * @param limits limits as defined in config
     * @returns record, key: item tplId, value: current/max item count allowed
     */
    protected initItemLimitCounter(limits: Record<string, number>): Record<string, {
        current: number;
        max: number;
    }>;
    /**
     * Get the next update timestamp for fence
     * @returns future timestamp
     */
    getNextFenceUpdateTimestamp(): number;
    /**
     * Get fence refresh time in seconds
     * @returns Refresh time in seconds
     */
    protected getFenceRefreshTime(): number;
    /**
     * Get fence level the passed in profile has
     * @param pmcData Player profile
     * @returns FenceLevel object
     */
    getFenceInfo(pmcData: IPmcData): IFenceLevel;
    /**
     * Remove an assort from fence by id
     * @param assortIdToRemove assort id to remove from fence assorts
     */
    removeFenceOffer(assortIdToRemove: string): void;
}
