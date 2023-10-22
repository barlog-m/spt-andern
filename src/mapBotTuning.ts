import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";
import { IPmcConfig } from "@spt-aki/models/spt/config/IPmcConfig";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IGlobals } from "@spt-aki/models/eft/common/IGlobals";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ILocationData } from "@spt-aki/models/spt/server/ILocations";
import {
    ILocationBase,
    BossLocationSpawn,
} from "@spt-aki/models/eft/common/ILocationBase";

import config from "../config/config.json";

export function mapBotTuning(container: DependencyContainer): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");

    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const databaseTables: IDatabaseTables = databaseServer.getTables();
    const globals: IGlobals = databaseServer.getTables().globals;

    if (config.mapMaxBotBuffMultiplier != 0) {
        setMaxBotCap(configServer);
        mapsTunning(databaseTables, logger);
    }

    setPmcBotDifficulty(configServer);

    if (config.mapBotAccuracyMultiplier != 0) {
        ajustBotWeaponScattering(globals);
    }
}

function setMaxBotCap(configServer: ConfigServer): undefined {
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);

    for (const map in botConfig.maxBotCap) {
        if (map === "factory4_night" || map === "laboratory") continue;

        botConfig.maxBotCap[map] = Math.ceil(
            botConfig.maxBotCap[map] * config.mapMaxBotBuffMultiplier
        );
    }
}

function setPmcBotDifficulty(configServer: ConfigServer): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.useDifficultyOverride = true;
    pmcConfig.difficulty = config.mapPmcBotDifficulty;
}

export function setPmcForceHealingItems(
    container: DependencyContainer
): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.forceHealingItemsIntoSecure = true;
}

function ajustBotWeaponScattering(globals: IGlobals): undefined {
    globals.BotWeaponScatterings.forEach((scattering) => {
        const divider = config.mapBotAccuracyMultiplier / 2;
        scattering.PriorityScatter100meter /= divider;
        scattering.PriorityScatter10meter /= divider;
        scattering.PriorityScatter1meter /= divider;
    });
}

function mapsTunning(
    databaseTables: IDatabaseTables,
    logger: ILogger
): undefined {
    Object.entries(databaseTables.locations).forEach(
        ([locationName, locationObj]) => {
            const location: ILocationData = locationObj;
            if (location.base) {
                const locationBase: ILocationBase = location.base;
                if (config.mapBotSettings) {
                    if (
                        locationBase.Name !== "Laboratory" &&
                        locationBase.Name !== "Factory"
                    ) {
                        if (config.mapMaxBotBuffMultiplier != 1) {
                            locationBase.BotMax = Math.ceil(
                                locationBase.BotMax *
                                    config.mapMaxBotBuffMultiplier
                            );
                        }
                    }

                    if (config.mapBotAccuracyMultiplier != 1) {
                        locationBase.BotLocationModifier.AccuracySpeed *=
                            config.mapBotAccuracyMultiplier;
                        locationBase.BotLocationModifier.Scattering /=
                            config.mapBotAccuracyMultiplier;
                    }
                }

                if (config.mapBossChanceBuff != 0) {
                    bossChanceChange(locationBase, logger);
                }
            }
        }
    );
}

function bossChanceChange(
    locationBase: ILocationBase,
    logger: ILogger
): undefined {
    Object.entries(locationBase.BossLocationSpawn).forEach(
        ([spawnKey, spawnObj]) => {
            const bossLocationSpawn: BossLocationSpawn = spawnObj;
            if (
                bossLocationSpawn.BossName !== "pmcBot" &&
                bossLocationSpawn.BossName !== "crazyAssaultEvent" &&
                bossLocationSpawn.BossName !== "exUsec"
            ) {
                if (
                    bossLocationSpawn.BossChance != 100 &&
                    bossLocationSpawn.BossChance > 0
                ) {
                    let chance = Math.round(
                        bossLocationSpawn.BossChance + config.mapBossChanceBuff
                    );
                    if (chance > 100) {
                        chance = 100;
                    }
                    if (chance < 0) {
                        chance = 0;
                    }
                    bossLocationSpawn.BossChance = chance;
                    logger.info(
                        `[Andern] location '${locationBase.Name}' boss '${bossLocationSpawn.BossName}' chance ${chance}`
                    );
                }
            }
        }
    );
}
