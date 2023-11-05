import { inject, injectable } from "tsyringe";

import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IInsuranceConfig } from "@spt-aki/models/spt/config/IInsuranceConfig";
import { IRagfairConfig } from "@spt-aki/models/spt/config/IRagfairConfig";
import { ImageRouter } from "@spt-aki/routers/ImageRouter";
import { Money } from "@spt-aki/models/enums/Money";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig";
import { Traders } from "@spt-aki/models/enums/Traders";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { TraderHelper } from "./TraderHelpers";
import { FluentAssortConstructor } from "./FluentTraderAssortCreator";
import { ModConfig } from "./ModConfig";
import * as baseJson from "../trader/base.json";
import * as config from "../config/config.json";

import * as fs from "fs";

interface TraderItem {
    tpl: string;
    name: string;
}

class TraderItems {
    one: TraderItem[];
    two: TraderItem[];
    three: TraderItem[];
    four: TraderItem[];
}

@injectable()
export class DoeTrader {
    items: TraderItems;
    traderHelper: TraderHelper;
    fluentTraderAssortHeper: FluentAssortConstructor;

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("ImageRouter") protected imageRouter: ImageRouter,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("ConfigServer") protected configServer: ConfigServer,
        @inject("JsonUtil") protected jsonUtil: JsonUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("AndernModPath") protected modPath: string
    ) {
        if (config.trader) {
            this.loadData();
        }
    }

    loadData(): undefined {
        const fullFileName = `${this.modPath}/trader/items.json`;
        const jsonData = fs.readFileSync(fullFileName, "utf-8");
        this.items = new TraderItems();
        Object.assign(this.items, JSON.parse(jsonData));
    }

    addAllItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
        itemHelper: ItemHelper
    ): undefined {
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.one,
            1,
            itemHelper
        );
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.two,
            2,
            itemHelper
        );
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.three,
            3,
            itemHelper
        );
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.four,
            4,
            itemHelper
        );
    }

    addTierItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
        items: TraderItem[],
        loyalityLevel: number,
        itemHelper: ItemHelper
    ): undefined {
        items.forEach((i) => {
            fluentTraderAssortHeper
                .createSingleAssortItem(i.tpl)
                .addUnlimitedStackCount()
                .addMoneyCost(Money.ROUBLES, itemHelper.getItemPrice(i.tpl))
                .addLoyaltyLevel(loyalityLevel)
                .export(tables.traders[baseJson._id]);
        });
    }

    public prepareTrader(
        preAkiModLoader: PreAkiModLoader,
        fullModName: string
    ): undefined {
        if (config.trader) {
            this.prepareTraderImpl(preAkiModLoader, fullModName);
        }
    }

    prepareTraderImpl(
        preAkiModLoader: PreAkiModLoader,
        fullModName: string
    ): undefined {
        const traderConfig: ITraderConfig =
            this.configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        this.traderHelper = new TraderHelper();
        this.fluentTraderAssortHeper = new FluentAssortConstructor(
            this.hashUtil,
            this.logger
        );
        this.traderHelper.registerProfileImage(
            baseJson,
            fullModName,
            preAkiModLoader,
            this.imageRouter,
            "doetrader.jpg"
        );
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600);

        Traders[baseJson._id] = baseJson._id;
    }

    public registerTrader(): undefined {
        if (config.trader) {
            this.registerTraderImpl();
        }
    }

    registerTraderImpl(): undefined {
        const tables = this.databaseServer.getTables();

        this.traderHelper.addTraderToDb(baseJson, tables, this.jsonUtil);

        this.addAllItems(this.fluentTraderAssortHeper, tables, this.itemHelper);

        this.traderHelper.addTraderToLocales(
            baseJson,
            tables,
            baseJson.name,
            ModConfig.traderName,
            baseJson.nickname,
            baseJson.location,
            ModConfig.traderDescription
        );

        const ragfairConfig = this.configServer.getConfig<IRagfairConfig>(
            ConfigTypes.RAGFAIR
        );
        ragfairConfig.traders[baseJson._id] = true;

        this.logger.info("[Andern] Doe trader registered");
    }

    public traderInsurance(): undefined {
        if (config.trader) {
            this.traderInsuranceImpl();
        }
    }

    traderInsuranceImpl(): undefined {
        const doeTraderId = baseJson._id;
        const praporDialogs = JSON.parse(
            JSON.stringify(
                this.databaseServer.getTables().traders[
                    "54cb50c76803fa8b248b4571"
                ].dialogue
            )
        ) as Record<string, string[]>;

        this.databaseServer.getTables().traders[doeTraderId].dialogue =
            praporDialogs;

        const insuranceConfig: IInsuranceConfig = this.configServer.getConfig(
            ConfigTypes.INSURANCE
        );

        insuranceConfig.returnChancePercent[doeTraderId] = 100;
        insuranceConfig.insuranceMultiplier[doeTraderId] = 0.1;
        insuranceConfig.returnTimeOverrideSeconds = 60;
        insuranceConfig.runIntervalSeconds = 60;
    }
}
