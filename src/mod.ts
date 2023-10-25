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
import { ISeasonalEventConfig } from "@spt-aki/models/spt/config/ISeasonalEventConfig";
import { ModConfig } from "./ModConfig";
import { DoeTrader } from "./DoeTrader";
import { PresetData } from "./PresetData";
import { WeaponGenerator } from "./WeaponGenerator";
import { GearGenerator } from "./GearGenerator";
import registerInfoUpdater from "./registerInfoUpdater";
import registerBotLevelGenerator from "./registerBotLevelGenerator";
import registerBotInventoryGenerator from "./registerBotInventoryGenerator";
import registerBotWeaponGenerator from "./registerBotWeaponGenerator";
import { RaidInfo } from "./RaidInfo";
import { NightHeadwear } from "./NightHeadwear";
import { lootConfig } from "./lootUtils";
import { mapBotTuning, setPmcForceHealingItems } from "./mapBotTuning";
import * as config from "../config/config.json";

export class Andern implements IPreAkiLoadMod, IPostAkiLoadMod, IPostDBLoadMod {
    private fullModName: string;
    private logger: ILogger;
    private doeTrader: DoeTrader;

    constructor() {
        this.fullModName = `${ModConfig.authorName}-${ModConfig.modName}`;
    }

    public preAkiLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const preAkiModLoader: PreAkiModLoader =
            container.resolve<PreAkiModLoader>("PreAkiModLoader");

        const modPath = `./${preAkiModLoader.getModPath(this.fullModName)}`;
        container.register("AndernModPath", { useValue: modPath });

        container.register<RaidInfo>("AndernRaidInfo", RaidInfo, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<PresetData>("AndernPresetData", PresetData, {
            lifecycle: Lifecycle.Singleton,
        });

        container.register<NightHeadwear>(
            "AndernNightHeadwear",
            NightHeadwear,
            {
                lifecycle: Lifecycle.Singleton,
            }
        );

        container.register<WeaponGenerator>(
            "AndernWeaponGenerator",
            WeaponGenerator,
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
            mapBotTuning(container);
        }

        setPmcForceHealingItems(container);

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

    private enableInsuranceOnLab(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        const mapLab: ILocationBase =
            databaseServer.getTables().locations["laboratory"].base;
        mapLab.Insurance = true;
    }

    private disableSeasonalEvents(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const seasonalEventConfig =
            configServer.getConfig<ISeasonalEventConfig>(
                ConfigTypes.SEASONAL_EVENT
            );
        seasonalEventConfig.enableSeasonalEventDetection = false;
    }
}

module.exports = { mod: new Andern() };
