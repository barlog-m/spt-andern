import { ItemHelper } from "@spt/helpers/ItemHelper";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";
import { TraderHelper } from "@spt/helpers/TraderHelper";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { Item } from "@spt/models/eft/common/tables/IItem";
import { ITraderBase } from "@spt/models/eft/common/tables/ITrader";
import { IInsuranceConfig } from "@spt/models/spt/config/IInsuranceConfig";
import { IInsuranceEquipmentPkg } from "@spt/models/spt/services/IInsuranceEquipmentPkg";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { SaveServer } from "@spt/servers/SaveServer";
import { DatabaseService } from "@spt/services/DatabaseService";
import { LocalisationService } from "@spt/services/LocalisationService";
import { MailSendService } from "@spt/services/MailSendService";
import { HashUtil } from "@spt/utils/HashUtil";
import { RandomUtil } from "@spt/utils/RandomUtil";
import { TimeUtil } from "@spt/utils/TimeUtil";
import { ICloner } from "@spt/utils/cloners/ICloner";
export declare class InsuranceService {
    protected logger: ILogger;
    protected databaseService: DatabaseService;
    protected randomUtil: RandomUtil;
    protected itemHelper: ItemHelper;
    protected hashUtil: HashUtil;
    protected timeUtil: TimeUtil;
    protected saveServer: SaveServer;
    protected traderHelper: TraderHelper;
    protected profileHelper: ProfileHelper;
    protected localisationService: LocalisationService;
    protected mailSendService: MailSendService;
    protected configServer: ConfigServer;
    protected cloner: ICloner;
    protected insured: Record<string, Record<string, Item[]>>;
    protected insuranceConfig: IInsuranceConfig;
    constructor(logger: ILogger, databaseService: DatabaseService, randomUtil: RandomUtil, itemHelper: ItemHelper, hashUtil: HashUtil, timeUtil: TimeUtil, saveServer: SaveServer, traderHelper: TraderHelper, profileHelper: ProfileHelper, localisationService: LocalisationService, mailSendService: MailSendService, configServer: ConfigServer, cloner: ICloner);
    /**
     * Does player have insurance array
     * @param sessionId Player id
     * @returns True if exists
     */
    isuranceDictionaryExists(sessionId: string): boolean;
    /**
     * Get all insured items by all traders for a profile
     * @param sessionId Profile id (session id)
     * @returns Item array
     */
    getInsurance(sessionId: string): Record<string, Item[]>;
    resetInsurance(sessionId: string): void;
    /**
     * Sends `i will go look for your stuff` trader message +
     * Store lost insurance items inside profile for later retreval
     * @param pmcData Profile to send insured items to
     * @param sessionID SessionId of current player
     * @param mapId Id of the location player died/exited that caused the insurance to be issued on
     */
    startPostRaidInsuranceLostProcess(pmcData: IPmcData, sessionID: string, mapId: string): void;
    /**
     * Get a timestamp of when insurance items should be sent to player based on trader used to insure
     * Apply insurance return bonus if found in profile
     * @param pmcData Player profile
     * @param trader Trader base used to insure items
     * @returns Timestamp to return items to player in seconds
     */
    protected getInsuranceReturnTimestamp(pmcData: IPmcData, trader: ITraderBase): number;
    /**
     * Take the insurance item packages within a profile session and ensure that each of the items in that package are
     * not orphaned from their parent ID.
     *
     * @param sessionID The session ID to update insurance equipment packages in.
     * @returns void
     */
    protected adoptOrphanedInsEquipment(sessionID: string): void;
    /**
     * Store lost gear post-raid inside profile, ready for later code to pick it up and mail it
     * @param equipmentPkg Gear to store - generated by getGearLostInRaid()
     */
    storeGearLostInRaidToSendLater(sessionID: string, equipmentPkg: IInsuranceEquipmentPkg[]): void;
    /**
     * For the passed in items, find the trader it was insured against
     * @param sessionId Session id
     * @param lostInsuredItems Insured items lost in a raid
     * @param pmcProfile Player profile
     * @returns IInsuranceEquipmentPkg array
     */
    mapInsuredItemsToTrader(sessionId: string, lostInsuredItems: Item[], pmcProfile: IPmcData): IInsuranceEquipmentPkg[];
    /**
     * Some items should never be returned in insurance but BSG send them in the request
     * @param lostItem Item being returned in insurance
     * @param inventoryItems Player inventory
     * @returns True if item
     */
    protected itemCannotBeLostOnDeath(lostItem: Item, inventoryItems: Item[]): boolean;
    /**
     * Add gear item to InsuredItems array in player profile
     * @param sessionID Session id
     * @param pmcData Player profile
     * @param itemToReturnToPlayer item to store
     * @param traderId Id of trader item was insured with
     */
    protected addGearToSend(gear: IInsuranceEquipmentPkg): void;
    /**
     * Does insurance exist for a player and by trader
     * @param sessionId Player id (session id)
     * @param traderId Trader items insured with
     * @returns True if exists
     */
    protected insuranceTraderArrayExists(sessionId: string, traderId: string): boolean;
    /**
     * Empty out array holding insured items by sessionid + traderid
     * @param sessionId Player id (session id)
     * @param traderId Trader items insured with
     */
    resetInsuranceTraderArray(sessionId: string, traderId: string): void;
    /**
     * Store insured item
     * @param sessionId Player id (session id)
     * @param traderId Trader item insured with
     * @param itemToAdd Insured item (with children)
     */
    addInsuranceItemToArray(sessionId: string, traderId: string, itemToAdd: Item): void;
    /**
     * Get price of insurance * multiplier from config
     * @param pmcData Player profile
     * @param inventoryItem Item to be insured
     * @param traderId Trader item is insured with
     * @returns price in roubles
     */
    getRoublePriceToInsureItemWithTrader(pmcData: IPmcData, inventoryItem: Item, traderId: string): number;
    /**
     * Returns the ID that should be used for a root-level Item's parentId property value within in the context of insurance.
     * @param sessionID Players id
     * @returns The root item Id.
     */
    getRootItemParentID(sessionID: string): string;
}
