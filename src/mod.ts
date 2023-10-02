import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ImageRouter } from "@spt-aki/routers/ImageRouter";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig";
import { IInsuranceConfig } from "@spt-aki/models/spt/config/IInsuranceConfig";
import { ILocationBase } from "@spt-aki/models/eft/common/ILocationBase";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";

import * as baseJson from "../db/base.json";
import { TraderHelper } from "./TraderHelpers";
import { FluentAssortConstructor } from "./FluentTraderAssortCreator";
import { Traders } from "@spt-aki/models/enums/Traders";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { IRagfairConfig } from "@spt-aki/models/spt/config/IRagfairConfig";

import { ModConfig } from "./ModConfig";
import { DoeTrader } from "./DoeTrader";
import { TierOneWeapon } from "./TierOneWeapon";
import { TierTwoWeapon } from "./TierTwoWeapon";
import { TierThreeWeapon } from "./TierThreeWeapon";
import { TierFourWeapon } from "./TierFourWeapon";
import registerInfoUpdater from "./registerInfoUpdater";
import registerBotLevelGenerator from "./registerBotLevelGenerator";
import registerBotInventoryGenerator from "./registerBotInventoryGenerator";
import { RaidInfo } from "./RaidInfo";
import { NightHeadwear } from "./NightHeadwear";
import { TierOneGear } from "./TierOneGear";
import { TierTwoGear } from "./TierTwoGear";
import { TierThreeGear } from "./TierThreeGear";
import { TierFourGear } from "./TierFourGear";
import { lootConfig } from "./lootUtils";
import * as config from "../config/config.json";

export class Andern implements IPreAkiLoadMod, IPostAkiLoadMod, IPostDBLoadMod {
    private fullModName: string;
    private logger: ILogger;
    private traderHelper: TraderHelper;
    private fluentTraderAssortHeper: FluentAssortConstructor;

    constructor() {
        this.fullModName = `${ModConfig.authorName}-${ModConfig.modName}`;
    }

    public preAkiLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const preAkiModLoader: PreAkiModLoader =
            container.resolve<PreAkiModLoader>("PreAkiModLoader");

        const resPath = `./${preAkiModLoader.getModPath(this.fullModName)}res`;
        container.register("ModResPath", { useValue: resPath });

        container.register<TierOneWeapon>(
            "AndernTierOneWeapon",
            TierOneWeapon,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );
        container.register<TierTwoWeapon>(
            "AndernTierTwoWeapon",
            TierTwoWeapon,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );
        container.register<TierThreeWeapon>(
            "AndernTierThreeWeapon",
            TierThreeWeapon,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );
        container.register<TierFourWeapon>(
            "AndernTierFourWeapon",
            TierFourWeapon,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<TierFourWeapon>(
            "AndernTierFourWeapon",
            TierFourWeapon,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<RaidInfo>("AndernRaidInfo", RaidInfo, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<NightHeadwear>(
            "AndernNightHeadwear",
            NightHeadwear,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<TierOneGear>("AndernTierOneGear", TierOneGear, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<TierTwoGear>("AndernTierTwoGear", TierTwoGear, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<TierThreeGear>(
            "AndernTierThreeGear",
            TierThreeGear,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<TierFourGear>("AndernTierFourGear", TierFourGear, {
            lifecycle: Lifecycle.Singleton,
        });

        registerInfoUpdater(container);
        registerBotLevelGenerator(container);
        registerBotInventoryGenerator(container);

        this.prepareTrader(container, preAkiModLoader);
    }

    public postDBLoad(container: DependencyContainer): void {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        lootConfig(container, databaseServer);

        this.registerTrader(container);
    }

    postAkiLoad(container: DependencyContainer): void {
        this.setMinFleaLevel(container);

        this.traderInsurance(container, baseJson._id);

        if (config.insuranceOnLab) {
            this.enableInsuranceOnLab(container);
        }
    }

    private prepareTrader(
        container: DependencyContainer,
        preAkiModLoader: PreAkiModLoader
    ): undefined {
        const imageRouter: ImageRouter =
            container.resolve<ImageRouter>("ImageRouter");
        const hashUtil: HashUtil = container.resolve<HashUtil>("HashUtil");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig =
            configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        this.traderHelper = new TraderHelper();
        this.fluentTraderAssortHeper = new FluentAssortConstructor(
            hashUtil,
            this.logger
        );
        this.traderHelper.registerProfileImage(
            baseJson,
            this.fullModName,
            preAkiModLoader,
            imageRouter,
            "doetrader.jpg"
        );
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600);

        Traders[baseJson._id] = baseJson._id;
    }

    private traderInsurance(
        container: DependencyContainer,
        doeTraderId: string
    ) {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");

        const praporDialogs = JSON.parse(
            JSON.stringify(
                databaseServer.getTables().traders["54cb50c76803fa8b248b4571"]
                    .dialogue
            )
        ) as Record<string, string[]>;

        databaseServer.getTables().traders[doeTraderId].dialogue =
            praporDialogs;

        const configServer = container.resolve<ConfigServer>("ConfigServer");

        const insuranceConfig: IInsuranceConfig = configServer.getConfig(
            ConfigTypes.INSURANCE
        );

        insuranceConfig.returnChancePercent[doeTraderId] = 100;
        insuranceConfig.insuranceMultiplier[doeTraderId] = 0.1;
    }

    private registerTrader(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");

        const tables = databaseServer.getTables();

        this.traderHelper.addTraderToDb(baseJson, tables, jsonUtil);

        DoeTrader.addItems(
            this.fluentTraderAssortHeper,
            tables,
            DoeTrader.items,
            1
        );
        DoeTrader.addItems(
            this.fluentTraderAssortHeper,
            tables,
            DoeTrader.tierFourItems,
            4
        );

        this.traderHelper.addTraderToLocales(
            baseJson,
            tables,
            baseJson.name,
            ModConfig.traderName,
            baseJson.nickname,
            baseJson.location,
            ModConfig.traderDescription
        );

        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const ragfairConfig = configServer.getConfig<IRagfairConfig>(
            ConfigTypes.RAGFAIR
        );
        ragfairConfig.traders[baseJson._id] = true;

        this.logger.info("[Andern] Doe trader registered");
    }

    private setMinFleaLevel(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const tables = databaseServer.getTables();
        const fleaMarket = tables.globals.config.RagFair;
        if (config.fleaMinUserLevel) {
            fleaMarket.minUserLevel = config.fleaMinUserLevel;
            this.logger.info(
                `[Andern] Flea Market minimal user level set to ${config.fleaMinUserLevel}`
            );
        }
    }

    private enableInsuranceOnLab(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const mapLab: ILocationBase =
            databaseServer.getTables().locations["laboratory"].base;
        mapLab.Insurance = true;
    }
}

module.exports = { mod: new Andern() };
