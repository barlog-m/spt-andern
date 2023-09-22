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
import { JsonUtil } from "@spt-aki/utils/JsonUtil";

import * as baseJson from "../db/base.json";
import { TraderHelper } from "./TraderHelpers";
import { FluentAssortConstructor } from "./FluentTraderAssortCreator";
import { Traders } from "@spt-aki/models/enums/Traders";
import { HashUtil } from "@spt-aki/utils/HashUtil";

import { ModConfig } from "./ModConfig";
import { DoeTrader } from "./DoeTrader";
import { TierOneWeapon } from "./TierOneWeapon";
import { TierTwoWeapon } from "./TierTwoWeapon";
import { TierThreeWeapon } from "./TierThreeWeapon";
import { TierFourWeapon } from "./TierFourWeapon";
import botWeaponChanges from "./botWeaponChanges";
import botLevelChanges from "./botLevelChanges";
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

        container.register<TierOneWeapon>("TierOneWeapon", TierOneWeapon, {
            lifecycle: Lifecycle.Singleton,
        });
        container.register<TierTwoWeapon>("TierTwoWeapon", TierTwoWeapon, {
            lifecycle: Lifecycle.Singleton,
        });
        container.register<TierThreeWeapon>(
            "TierThreeWeapon",
            TierThreeWeapon,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );
        container.register<TierFourWeapon>("TierFourWeapon", TierFourWeapon, {
            lifecycle: Lifecycle.Singleton,
        });

        botLevelChanges(container);
        botWeaponChanges(container);

        this.prepareTrader(container, preAkiModLoader);
    }

    postAkiLoad(container: DependencyContainer): void {
        this.banScavVestForPmc(container);
        this.setMinFleaLevel(container);
    }

    public postDBLoad(container: DependencyContainer): void {
        this.registerTrader(container);
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

    private registerTrader(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");

        const tables = databaseServer.getTables();

        this.traderHelper.addTraderToDb(baseJson, tables, jsonUtil);

        DoeTrader.addItems(this.fluentTraderAssortHeper, tables);

        this.traderHelper.addTraderToLocales(
            baseJson,
            tables,
            baseJson.name,
            ModConfig.traderName,
            baseJson.nickname,
            baseJson.location,
            ModConfig.traderDescription
        );

        this.logger.info("[Andern] Doe trader registered");
    }

    private banScavVestForPmc(container: DependencyContainer): undefined {
        const scavVestId = "572b7adb24597762ae139821";
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const tables = databaseServer.getTables();

        delete tables.bots.types.bear.inventory.equipment.TacticalVest[
            scavVestId
        ];
        delete tables.bots.types.usec.inventory.equipment.TacticalVest[
            scavVestId
        ];

        /*
        this.logger.info(
            `[Andern] bear vests ${JSON.stringify(
                tables.bots.types.bear.inventory.equipment.TacticalVest
            )}`
        );
        */
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
}

module.exports = { mod: new Andern() };
