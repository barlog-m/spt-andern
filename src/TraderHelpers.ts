import {
    ITraderBase,
    ITraderAssort,
} from "@spt/models/eft/common/tables/ITrader";
import {
    ITraderConfig,
    IUpdateTime,
} from "@spt/models/spt/config/ITraderConfig";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { JsonUtil } from "@spt/utils/JsonUtil";

export class TraderHelper {
    /**
     * Add record to trader config to set the refresh time of trader in seconds (default is 60 minutes)
     * @param traderConfig trader config to add our trader to
     * @param baseJson json file for trader (db/base.json)
     * @param refreshTimeSecondsMin How many seconds between trader stock refresh min time
     * @param refreshTimeSecondsMax How many seconds between trader stock refresh max time
     */
    public setTraderUpdateTime(
        traderConfig: ITraderConfig,
        baseJson: any,
        refreshTimeSecondsMin: number,
        refreshTimeSecondsMax: number
    ): void {
        // Add refresh time in seconds to config
        const traderRefreshRecord: IUpdateTime = {
            traderId: baseJson._id,
            seconds: {
                min: refreshTimeSecondsMin,
                max: refreshTimeSecondsMax,
            },
        };

        traderConfig.updateTime.push(traderRefreshRecord);
    }

    /**
     * Add our new trader to the database
     * @param traderDetailsToAdd trader details
     * @param tables database
     * @param jsonUtil json utility class
     */
    // rome-ignore lint/suspicious/noExplicitAny: traderDetailsToAdd comes from base.json, so no type
    public addTraderToDb(
        traderDetailsToAdd: any,
        tables: IDatabaseTables,
        jsonUtil: JsonUtil
    ): void {
        // Add trader to trader table, key is the traders id
        tables.traders[traderDetailsToAdd._id] = {
            assort: this.createAssortTable(), // assorts are the 'offers' trader sells, can be a single item (e.g. carton of milk) or multiple items as a collection (e.g. a gun)
            base: jsonUtil.deserialize(
                jsonUtil.serialize(traderDetailsToAdd)
            ) as ITraderBase, // Deserialise/serialise creates a copy of the json and allows us to cast it as an ITraderBase
            questassort: {
                started: {},
                success: {},
                fail: {},
            }, // questassort is empty as trader has no assorts unlocked by quests
        };
    }

    /**
     * Create basic data for trader + add empty assorts table for trader
     * @param tables SPT db
     * @param jsonUtil SPT JSON utility class
     * @returns ITraderAssort
     */
    private createAssortTable(): ITraderAssort {
        // Create a blank assort object, ready to have items added
        const assortTable: ITraderAssort = {
            nextResupply: 0,
            items: [],
            barter_scheme: {},
            loyal_level_items: {},
        };

        return assortTable;
    }

    /**
     * Add traders name/location/description to the locale table
     * @param baseJson json file for trader (db/base.json)
     * @param tables database tables
     * @param fullName Complete name of trader
     * @param firstName First name of trader
     * @param nickName Nickname of trader
     * @param location Location of trader (e.g. "Here in the cat shop")
     * @param description Description of trader
     */
    public addTraderToLocales(
        baseJson: any,
        tables: IDatabaseTables,
        fullName: string,
        firstName: string,
        nickName: string,
        location: string,
        description: string
    ) {
        // For each language, add locale for the new trader
        const locales = Object.values(tables.locales.global) as Record<
            string,
            string
        >[];
        for (const locale of locales) {
            locale[`${baseJson._id} FullName`] = fullName;
            locale[`${baseJson._id} FirstName`] = firstName;
            locale[`${baseJson._id} Nickname`] = nickName;
            locale[`${baseJson._id} Location`] = location;
            locale[`${baseJson._id} Description`] = description;
        }
    }
}
