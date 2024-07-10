import {DependencyContainer, Lifecycle} from "tsyringe";

import {IPreSptLoadMod} from "@spt/models/external/IPreSptLoadMod";
import {IPostSptLoadMod} from "@spt/models/external/IPostSptLoadMod";
import {IPostDBLoadMod} from "@spt/models/external/IPostDBLoadMod";
import {ILogger} from "@spt/models/spt/utils/ILogger";
import {PreSptModLoader} from "@spt/loaders/PreSptModLoader";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {ILocationBase} from "@spt/models/eft/common/ILocationBase";
import {ConfigServer} from "@spt/servers/ConfigServer";
import {ConfigTypes} from "@spt/models/enums/ConfigTypes";
import {IPmcConfig} from "@spt/models/spt/config/IPmcConfig";
import {MemberCategory} from "@spt/models/enums/MemberCategory";
import {
    ISeasonalEventConfig
} from "@spt/models/spt/config/ISeasonalEventConfig";
import {IRagfairConfig} from "@spt/models/spt/config/IRagfairConfig";
import {DoeTraderArmorGenerator} from "./DoeTraderArmorGenerator";
import {IPlayerScavConfig} from "@spt/models/spt/config/IPlayerScavConfig";
import {ModConfig} from "./ModConfig";
import {DoeTrader} from "./DoeTrader";
import {Data} from "./Data";
import {LootGenerator} from "./lootGenerator";
import {WeaponGenerator} from "./WeaponGenerator";
import {GearGenerator} from "./GearGenerator";
import {GearGeneratorHelper} from "./GearGeneratorHelper";
import {HelmetGenerator} from "./HelmetGenerator";
import registerInfoUpdater from "./registerInfoUpdater";
import registerBotLootGenerator from "./registerBotLootGenerator";
import registerBotLevelGenerator from "./registerBotLevelGenerator";
import registerBotInventoryGenerator from "./registerBotInventoryGenerator";
import registerBotWeaponGenerator from "./registerBotWeaponGenerator";
import {RaidInfo} from "./RaidInfo";
import {lootConfig} from "./lootUtils";
import {mapBotTuning, setPmcForceHealingItems} from "./mapBotTuning";
import cheeseQuests from "./questUtils";
import vssOverheatFix from "./weaponUtils";
import {setSeasonFromConfig, setSeasonRandom} from "./seasonUtils";
import * as config from "../config/config.json";
import registerRandomSeason from "./registerRandomSeason";

export class Andern implements IPreSptLoadMod, IPostSptLoadMod, IPostDBLoadMod {
    private readonly fullModName: string;
    private modPath: string;
    private logger: ILogger;
    private doeTrader: DoeTrader;

    constructor() {
        this.fullModName = `${ModConfig.authorName}-${ModConfig.modName}`;
    }

    public preSptLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const preSptModLoader: PreSptModLoader =
            container.resolve<PreSptModLoader>("PreSptModLoader");

        this.modPath = `./${preSptModLoader.getModPath(this.fullModName)}`;
        container.register("AndernModPath", {useValue: this.modPath});

        container.register<RaidInfo>("AndernRaidInfo", RaidInfo, {
            lifecycle: Lifecycle.Singleton
        });

        container.register<Data>("AndernData", Data, {
            lifecycle: Lifecycle.Singleton
        });


        container.register<LootGenerator>(
            "AndernLootGenerator",
            LootGenerator,
            {
                lifecycle: Lifecycle.Singleton
            }
        );

        container.register<WeaponGenerator>(
            "AndernWeaponGenerator",
            WeaponGenerator,
            {
                lifecycle: Lifecycle.Singleton
            }
        );

        container.register<GearGeneratorHelper>(
            "AndernGearGeneratorHelper",
            GearGeneratorHelper,
            {
                lifecycle: Lifecycle.Singleton
            }
        );

        container.register<HelmetGenerator>(
            "AndernHelmetGenerator",
            HelmetGenerator,
            {
                lifecycle: Lifecycle.Singleton
            }
        );

        container.register<GearGenerator>(
            "AndernGearGenerator",
            GearGenerator,
            {
                lifecycle: Lifecycle.Singleton
            }
        );

        container.register<DoeTraderArmorGenerator>(
            "AndernDoeTraderArmorGenerator",
            DoeTraderArmorGenerator,
            {
                lifecycle: Lifecycle.Singleton
            }
        );

        container.register<DoeTrader>("AndernDoeTrader", DoeTrader, {
            lifecycle: Lifecycle.Singleton
        });
        this.doeTrader = container.resolve<DoeTrader>("AndernDoeTrader");

        registerInfoUpdater(container);

        if (config.seasonRandom) {
            registerRandomSeason(container);
        }

        if (config.pmcBackpackLoot || config.disableBotBackpackLoot) {
            registerBotLootGenerator(container);
        }

        if (config.pmcLevels) {
            registerBotLevelGenerator(container);
        }

        if (config.pmcGear) {
            registerBotInventoryGenerator(container);
        } else if (config.pmcWeapon) {
            registerBotWeaponGenerator(container);
        }

        this.doeTrader.prepareTrader(preSptModLoader, this.fullModName);
    }

    public postDBLoad(container: DependencyContainer): void {
        lootConfig(container);
        this.doeTrader.registerTrader();

        if (config.fleaBlacklistDisable) {
            this.disableFleaBlacklist(container);
        }

        container.resolve<Data>("AndernData").fillArmorPlatesData();
    }

    postSptLoad(container: DependencyContainer): void {
        this.setMinFleaLevel(container);

        if (config.trader && config.traderInsurance) {
            this.doeTrader.traderInsurance();
        }

        if (config.trader && config.traderRepair) {
            this.doeTrader.traderRepair();
        }

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

        if (config.insuranceIncreaseStorageTime || config.insuranceDecreaseReturnTime) {
            this.insuranceTune(container);
        }

        if (config.cheeseQuests) {
            cheeseQuests(container);
        }

        vssOverheatFix(container);

        if (config.seasonRandom) {
            setSeasonRandom(container);
        } else {
            setSeasonFromConfig(container);
        }

        if (config.disableBtr) {
            this.disableBtr(container);
        }

        if (config.playerScavAlwaysHasBackpack) {
            this.playerScavAlwaysHasBackpack(container);
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
            (key) => !isNaN(Number(key))
        )) {
            pmcConfig.accountTypeWeight[memberCategoryKey] = 0;
        }
        pmcConfig.accountTypeWeight[MemberCategory.DEFAULT] = 25;
    }

    disablePmcBackpackWeapon(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
        pmcConfig.looseWeaponInBackpackChancePercent = 0;
        pmcConfig.looseWeaponInBackpackLootMinMax = {min: 0, max: 0};
    }

    disableSeasonalEvents(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const seasonalEventConfig =
            configServer.getConfig<ISeasonalEventConfig>(
                ConfigTypes.SEASONAL_EVENT
            );
        seasonalEventConfig.enableSeasonalEventDetection = false;
    }

    insuranceTune(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");

        const traders = databaseServer.getTables().traders

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const PRAPOR_ID = "54cb50c76803fa8b248b4571";
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const THERAPIST_ID = "54cb57776803fa99248b456e";

        if (config.insuranceDecreaseReturnTime) {
            traders[PRAPOR_ID].base.insurance.min_return_hour = 2;
            traders[PRAPOR_ID].base.insurance.max_return_hour = 3;

            traders[THERAPIST_ID].base.insurance.min_return_hour = 1;
            traders[THERAPIST_ID].base.insurance.max_return_hour = 2;
        }

        if (config.insuranceIncreaseStorageTime) {
            traders[PRAPOR_ID].base.insurance.max_storage_time = 336;
            traders[THERAPIST_ID].base.insurance.max_storage_time = 336;
        }

    }

    disableFleaBlacklist(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const ragfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR);
        ragfairConfig.dynamic.blacklist.enableBsgList = false;
        ragfairConfig.dynamic.blacklist.traderItems = true;
    }

    disableBtr(container: DependencyContainer): undefined {
        const databaseServer: DatabaseServer =
            container.resolve<DatabaseServer>("DatabaseServer");
        databaseServer.getTables().globals.config.BTRSettings.LocationsWithBTR = []
    }

    playerScavAlwaysHasBackpack(container: DependencyContainer): undefined {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const playerScavConfig = configServer.getConfig<IPlayerScavConfig>(ConfigTypes.PLAYERSCAV);
        Object.entries(playerScavConfig.karmaLevel).forEach(([karmaLevel, karmaValues]) => {
            karmaValues.modifiers.equipment["Backpack"] = 100;
        });
    }
}

module.exports = {mod: new Andern()};
