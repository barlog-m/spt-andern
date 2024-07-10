import {inject, injectable} from "tsyringe";

import {ILogger} from "@spt/models/spt/utils/ILogger";
import {HashUtil} from "@spt/utils/HashUtil";
import {JsonUtil} from "@spt/utils/JsonUtil";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {ConfigServer} from "@spt/servers/ConfigServer";
import {ConfigTypes} from "@spt/models/enums/ConfigTypes";
import {IInsuranceConfig} from "@spt/models/spt/config/IInsuranceConfig";
import {IRagfairConfig} from "@spt/models/spt/config/IRagfairConfig";
import {ImageRouter} from "@spt/routers/ImageRouter";
import {Money} from "@spt/models/enums/Money";
import {IDatabaseTables} from "@spt/models/spt/server/IDatabaseTables";
import {ItemHelper} from "@spt/helpers/ItemHelper";
import {ITraderConfig} from "@spt/models/spt/config/ITraderConfig";
import {Traders} from "@spt/models/enums/Traders";
import {PreSptModLoader} from "@spt/loaders/PreSptModLoader";
import {TraderHelper} from "./TraderHelpers";
import {FluentAssortConstructor} from "./FluentTraderAssortCreator";
import {DoeTraderArmorGenerator} from "./DoeTraderArmorGenerator";
import {ModConfig} from "./ModConfig";
import * as baseJson from "../trader/base.json";
import * as config from "../config/config.json";

import * as fs from "fs";
import JSON5 from "json5";

class TraderItems {
    one: string[];
    two: string[];
    three: string[];
    four: string[];
}

@injectable()
export class DoeTrader {
    items: TraderItems;
    traderHelper: TraderHelper;
    fluentTraderAssortHelper: FluentAssortConstructor;

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("ImageRouter") protected imageRouter: ImageRouter,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("ConfigServer") protected configServer: ConfigServer,
        @inject("JsonUtil") protected jsonUtil: JsonUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("AndernDoeTraderArmorGenerator") protected traderArmorGenerator: DoeTraderArmorGenerator,
        @inject("AndernModPath") protected modPath: string
    ) {
        if (config.trader) {
            this.loadData();
        }
    }

    loadData(): undefined {
        const fullFileName = `${this.modPath}/trader/items.json5`;
        const jsonData = fs.readFileSync(fullFileName, "utf-8");
        this.items = new TraderItems();
        Object.assign(this.items, JSON5.parse(jsonData));
    }

    addAllItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
    ): undefined {
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.one,
            1,
        );
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.two,
            2,
        );
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.three,
            3,
        );
        this.addTierItems(
            fluentTraderAssortHeper,
            tables,
            this.items.four,
            4,
        );
    }

    addTierItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
        items: string[],
        loyaltyLevel: number
    ): undefined {
        items.forEach((itemTpl) => {
            if (this.traderArmorGenerator.isArmor(itemTpl)) {
                const items = this.traderArmorGenerator.getArmor(itemTpl);
                const itemTpls = items.map(i => i._tpl)
                fluentTraderAssortHeper.createComplexAssortItem(items)
                    .addMoneyCost(Money.ROUBLES, this.itemHelper.getItemAndChildrenPrice(itemTpls))
                    .addLoyaltyLevel(loyaltyLevel)
                    .export(tables.traders[baseJson._id]);

            } else {
                fluentTraderAssortHeper
                    .createSingleAssortItem(itemTpl)
                    .addMoneyCost(Money.ROUBLES, this.itemHelper.getItemPrice(itemTpl))
                    .addLoyaltyLevel(loyaltyLevel)
                    .export(tables.traders[baseJson._id]);
            }
        });
    }

    public prepareTrader(
        preSptModLoader: PreSptModLoader,
        fullModName: string
    ): undefined {
        if (config.trader) {
            this.prepareTraderImpl(preSptModLoader, fullModName);
        }
    }

    prepareTraderImpl(
        preSptModLoader: PreSptModLoader,
        fullModName: string
    ): undefined {
        const traderConfig: ITraderConfig =
            this.configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        this.traderHelper = new TraderHelper();
        this.fluentTraderAssortHelper = new FluentAssortConstructor(
            this.hashUtil,
            this.logger
        );
        this.traderHelper.registerProfileImage(
            baseJson,
            fullModName,
            preSptModLoader,
            this.imageRouter,
            "doetrader.jpg"
        );
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 2400, 3600);

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

        this.addAllItems(this.fluentTraderAssortHelper, tables);

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
        const praporId = "54cb50c76803fa8b248b4571";
        const traders = this.databaseServer.getTables().traders;
        const doeTraderId = baseJson._id;
        const praporDialogs = JSON.parse(
            JSON.stringify(traders[praporId].dialogue)
        ) as Record<string, string[]>;

        const trader = traders[doeTraderId];
        trader.dialogue = praporDialogs;
        trader.base.insurance.availability = true;

        const insuranceConfig: IInsuranceConfig = this.configServer.getConfig(
            ConfigTypes.INSURANCE
        );

        insuranceConfig.returnChancePercent[doeTraderId] = 100;
        insuranceConfig.runIntervalSeconds = 60;
    }

    public traderRepair(): undefined {
        const doeTraderId = baseJson._id;

        const trader = this.databaseServer.getTables().traders[doeTraderId];
        trader.base.repair.availability = true;
    }
}
