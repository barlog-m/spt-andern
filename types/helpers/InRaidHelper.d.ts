import { QuestController } from "@spt/controllers/QuestController";
import { InventoryHelper } from "@spt/helpers/InventoryHelper";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { Item } from "@spt/models/eft/common/tables/IItem";
import { IInRaidConfig } from "@spt/models/spt/config/IInRaidConfig";
import { ILostOnDeathConfig } from "@spt/models/spt/config/ILostOnDeathConfig";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { DatabaseService } from "@spt/services/DatabaseService";
import { ICloner } from "@spt/utils/cloners/ICloner";
import { ProfileHelper } from "./ProfileHelper";
import { QuestHelper } from "./QuestHelper";
export declare class InRaidHelper {
    protected logger: ILogger;
    protected inventoryHelper: InventoryHelper;
    protected itemHelper: ItemHelper;
    protected configServer: ConfigServer;
    protected cloner: ICloner;
    protected databaseService: DatabaseService;
    protected questController: QuestController;
    protected profileHelper: ProfileHelper;
    protected questHelper: QuestHelper;
    protected lostOnDeathConfig: ILostOnDeathConfig;
    protected inRaidConfig: IInRaidConfig;
    constructor(logger: ILogger, inventoryHelper: InventoryHelper, itemHelper: ItemHelper, configServer: ConfigServer, cloner: ICloner, databaseService: DatabaseService, questController: QuestController, profileHelper: ProfileHelper, questHelper: QuestHelper);
    /**
     * @deprecated
     * Reset the skill points earned in a raid to 0, ready for next raid
     * @param profile Profile to update
     */
    protected resetSkillPointsEarnedDuringRaid(profile: IPmcData): void;
    /**
     * Update a players inventory post-raid
     * Remove equipped items from pre-raid
     * Add new items found in raid to profile
     * Store insurance items in profile
     * @param sessionID Session id
     * @param serverProfile Profile to update
     * @param postRaidProfile Profile returned by client after a raid
     */
    setInventory(sessionID: string, serverProfile: IPmcData, postRaidProfile: IPmcData, isSurvived: boolean): void;
    /**
     * Iterate over inventory items and remove the property that defines an item as Found in Raid
     * Only removes property if item had FiR when entering raid
     * @param postRaidProfile profile to update items for
     * @returns Updated profile with SpawnedInSession removed
     */
    removeSpawnedInSessionPropertyFromItems(postRaidProfile: IPmcData): IPmcData;
    /**
     * Clear PMC inventory of all items except those that are exempt
     * Used post-raid to remove items after death
     * @param pmcData Player profile
     * @param sessionId Session id
     */
    deleteInventory(pmcData: IPmcData, sessionId: string): void;
    /**
     * Remove FiR status from designated container
     * @param sessionId Session id
     * @param pmcData Player profile
     * @param secureContainerSlotId Container slot id to find items for and remove FiR from
     */
    removeFiRStatusFromItemsInContainer(sessionId: string, pmcData: IPmcData, secureContainerSlotId: string): void;
    /**
     * Deletes quest conditions from pickup tasks given a list of quest items being carried by a PMC.
     * @param carriedQuestItems Items carried by PMC at death, usually gotten from "CarriedQuestItems"
     * @param sessionId Current sessionId
     * @param pmcProfile Pre-raid profile that is being handled with raid information
     */
    removePickupQuestConditions(carriedQuestItems: string[], sessionId: string, pmcProfile: IPmcData): void;
    /**
     * Get an array of items from a profile that will be lost on death
     * @param pmcProfile Profile to get items from
     * @returns Array of items lost on death
     */
    protected getInventoryItemsLostOnDeath(pmcProfile: IPmcData): Item[];
    /**
     * Does the provided items slotId mean its kept on the player after death
     * @pmcData Player profile
     * @itemToCheck Item to check should be kept
     * @returns true if item is kept after death
     */
    protected isItemKeptAfterDeath(pmcData: IPmcData, itemToCheck: Item): boolean;
}
