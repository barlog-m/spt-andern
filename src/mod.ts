import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ILocationBase } from "@spt-aki/models/eft/common/ILocationBase";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IPmcConfig } from "@spt-aki/models/spt/config/IPmcConfig";
import { MemberCategory } from "@spt-aki/models/enums/MemberCategory";
import { ISeasonalEventConfig } from "@spt-aki/models/spt/config/ISeasonalEventConfig";
import { ModConfig } from "./ModConfig";
import { DoeTrader } from "./DoeTrader";
import { Data } from "./Data";
import { WeaponGenerator } from "./WeaponGenerator";
import { GearGenerator } from "./GearGenerator";
import { GearGeneratorHelper } from "./GearGeneratorHelper";
import { HelmetGenerator } from "./HelmetGenerator";
import registerInfoUpdater from "./registerInfoUpdater";
import registerBotLevelGenerator from "./registerBotLevelGenerator";
import registerBotInventoryGenerator from "./registerBotInventoryGenerator";
import registerBotWeaponGenerator from "./registerBotWeaponGenerator";
import { RaidInfo } from "./RaidInfo";
import { lootConfig } from "./lootUtils";
import { mapBotTuning, setPmcForceHealingItems } from "./mapBotTuning";
import * as config from "../config/config.json";

export class Andern implements IPreAkiLoadMod, IPostAkiLoadMod, IPostDBLoadMod {
    private fullModName: string;
    private modPath: string;
    private logger: ILogger;
    private doeTrader: DoeTrader;

    constructor() {
        this.fullModName = `${ModConfig.authorName}-${ModConfig.modName}`;
    }

    public preAkiLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const preAkiModLoader: PreAkiModLoader =
            container.resolve<PreAkiModLoader>("PreAkiModLoader");

        this.modPath = `./${preAkiModLoader.getModPath(this.fullModName)}`;
        container.register("AndernModPath", { useValue: this.modPath });

        container.register<RaidInfo>("AndernRaidInfo", RaidInfo, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<Data>("AndernData", Data, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<WeaponGenerator>(
            "AndernWeaponGenerator",
            WeaponGenerator,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<GearGeneratorHelper>(
            "AndernGearGeneratorHelper",
            GearGeneratorHelper,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<HelmetGenerator>(
            "AndernHelmetGenerator",
            HelmetGenerator,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<GearGenerator>(
            "AndernGearGenerator",
            GearGenerator,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<DoeTrader>("AndernDoeTrader", DoeTrader, {
            lifecycle: Lifecycle.Singleton,
        });
        this.doeTrader = container.resolve<DoeTrader>("AndernDoeTrader");

        registerInfoUpdater(container);

        if (config.pmcLevels) {
            registerBotLevelGenerator(container);
        }

        if (config.pmcGear) {
            registerBotInventoryGenerator(container);
        } else {
            registerBotWeaponGenerator(container);
        }

        this.doeTrader.prepareTrader(preAkiModLoader, this.fullModName);
    }

    public postDBLoad(container: DependencyContainer): void {
        lootConfig(container);
        this.doeTrader.registerTrader();
    }

    postAkiLoad(container: DependencyContainer): void {
        this.setMinFleaLevel(container);

        this.doeTrader.traderInsurance();

        if (config.insuranceOnLab) {
            this.enableInsuranceOnLab(container);
        }

        if (config.mapBotSettings) {
            mapBotTuning(container, this.modPath, this.logger);
        }

        setPmcForceHealingItems(container, this.logger);

        if (
            config.disablePmcBackpackWeapon ||
            config.lootingBotsCompatibility
        ) {
            this.disablePmcBackpackWeapon(container);
        }

        if (config.disableEmissaryPmcBots) {
            this.disableEmissaryPmcBots(container);
        }
        if (config.disableSeasonalEvents) {
            this.disableSeasonalEvents(container);
        }
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

    enableInsuranceOnLab(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const mapLab: ILocationBase =
            databaseServer.getTables().locations["laboratory"].base;
        mapLab.Insurance = true;
    }

    disableEmissaryPmcBots(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

        for (const memberCategoryKey of Object.keys(MemberCategory).filter(
            (key) => !isNaN(key)
        )) {
            pmcConfig.accountTypeWeight[memberCategoryKey] = 0;
        }
        pmcConfig.accountTypeWeight[MemberCategory.DEFAULT] = 25;
    }

    disablePmcBackpackWeapon(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
        pmcConfig.looseWeaponInBackpackChancePercent = 0;
        pmcConfig.looseWeaponInBackpackLootMinMax = { min: 0, max: 0 };
    }

    disableSeasonalEvents(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const seasonalEventConfig =
            configServer.getConfig<ISeasonalEventConfig>(
                ConfigTypes.SEASONAL_EVENT
            );
        seasonalEventConfig.enableSeasonalEventDetection = false;
    }
}

module.exports = { mod: new Andern() };
