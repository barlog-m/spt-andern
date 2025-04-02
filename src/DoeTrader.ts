import { inject, injectable } from "tsyringe";

import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { HashUtil } from "@spt/utils/HashUtil";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IInsuranceConfig } from "@spt/models/spt/config/IInsuranceConfig";
import { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import { ImageRouter } from "@spt/routers/ImageRouter";
import { Money } from "@spt/models/enums/Money";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { ITraderConfig } from "@spt/models/spt/config/ITraderConfig";
import { Traders } from "@spt/models/enums/Traders";
import { TraderHelper } from "./TraderHelpers";
import { FluentAssortConstructor } from "./FluentTraderAssortCreator";
import { DoeTraderArmorGenerator } from "./DoeTraderArmorGenerator";
import { ModConfig } from "./ModConfig";
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
    readonly doeTraderId = baseJson._id;
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
        @inject("AndernDoeTraderArmorGenerator")
        protected traderArmorGenerator: DoeTraderArmorGenerator,
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
        tables: IDatabaseTables
    ): undefined {
        this.addTierItems(fluentTraderAssortHeper, tables, this.items.one, 1);
        this.addTierItems(fluentTraderAssortHeper, tables, this.items.two, 2);
        this.addTierItems(fluentTraderAssortHeper, tables, this.items.three, 3);
        this.addTierItems(fluentTraderAssortHeper, tables, this.items.four, 4);
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
                const itemTpls = items.map((i) => i._tpl);
                fluentTraderAssortHeper
                    .createComplexAssortItem(items)
                    .addMoneyCost(
                        Money.ROUBLES,
                        this.itemHelper.getItemAndChildrenPrice(itemTpls)
                    )
                    .addLoyaltyLevel(loyaltyLevel)
                    .addStackCount(3)
                    .export(tables.traders[baseJson._id]);
            } else {
                const AMMO_TPL = "5485a8684bdc2da71d8b4567";
                const ITEM_COUNT = 3;
                const AMMO_COUNT = 1200;

                const count = this.itemHelper.isOfBaseclass(itemTpl, AMMO_TPL)
                    ? AMMO_COUNT
                    : ITEM_COUNT;

                fluentTraderAssortHeper
                    .createSingleAssortItem(itemTpl)
                    .addMoneyCost(
                        Money.ROUBLES,
                        this.itemHelper.getItemPrice(itemTpl)
                    )
                    .addLoyaltyLevel(loyaltyLevel)
                    .addStackCount(count)
                    .export(tables.traders[baseJson._id]);
            }
        });
    }

    public prepareTrader(): undefined {
        const traderConfig: ITraderConfig =
            this.configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        this.traderHelper = new TraderHelper();
        this.fluentTraderAssortHelper = new FluentAssortConstructor(
            this.hashUtil,
            this.logger
        );

        this.imageRouter.addRoute(
            baseJson.avatar.replace(".jpg", ""),
            `${this.modPath}/trader/doetrader.jpg`
        );

        this.traderHelper.setTraderUpdateTime(
            traderConfig,
            baseJson,
            2400,
            3600
        );

        Traders[baseJson._id] = baseJson._id;
    }

    copyDialogs() {
        const traders = this.databaseServer.getTables().traders;

        const praporDialogs = JSON.parse(
            JSON.stringify(traders[Traders.THERAPIST].dialogue)
        ) as Record<string, string[]>;

        const trader = traders[this.doeTraderId];
        trader.dialogue = praporDialogs;
    }

    public registerTrader(): undefined {
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
        ragfairConfig.traders[this.doeTraderId] = true;

        this.copyDialogs();

        this.logger.info("[Andern] Doe trader registered");
    }

    public traderInsurance(): undefined {
        const traders = this.databaseServer.getTables().traders;
        const trader = traders[this.doeTraderId];

        trader.base.insurance.availability = true;

        const insuranceConfig: IInsuranceConfig = this.configServer.getConfig(
            ConfigTypes.INSURANCE
        );

        insuranceConfig.returnChancePercent[this.doeTraderId] = 100;
        insuranceConfig.runIntervalSeconds = 60;
    }

    public traderRepair(): undefined {
        const trader =
            this.databaseServer.getTables().traders[this.doeTraderId];
        trader.base.repair.availability = true;
    }
}
