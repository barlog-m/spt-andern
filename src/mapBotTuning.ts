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

    if (config.mapMaxBotBuffPercentage > 0) {
        setMaxBotCap(configServer);
        mapsSpawnTunning(databaseTables, logger);
    }

    setPmcBotDifficulty(configServer);

    if (config.mapBotScatteringIncreasePercentage > 0) {
        ajustBotWeaponScattering(globals);
    }
}

function setMaxBotCap(configServer: ConfigServer): undefined {
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);

    for (const map in botConfig.maxBotCap) {
        if (map === "factory4_night" || map === "laboratory") continue;
        if (botConfig.maxBotCap[map] < config.mapMaxBotBuffPercentage) {
            botConfig.maxBotCap[map] += Math.ceil(
                botConfig.maxBotCap[map] *
                    (config.mapMaxBotBuffPercentage / 100)
            );
        }
    }
}

function setPmcBotDifficulty(configServer: ConfigServer): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.useDifficultyOverride = true;
    pmcConfig.difficulty = config.mapPmcBotDifficulty;
}

function ajustBotWeaponScattering(globals: IGlobals): undefined {
    globals.BotWeaponScatterings.forEach((scattering) => {
        scattering.PriorityScatter100meter = increaseValueByPercentage(
            scattering.PriorityScatter100meter,
            config.mapBotScatteringIncreasePercentage
        );
        scattering.PriorityScatter10meter = increaseValueByPercentage(
            scattering.PriorityScatter10meter,
            config.mapBotScatteringIncreasePercentage
        );
        scattering.PriorityScatter1meter = increaseValueByPercentage(
            scattering.PriorityScatter1meter,
            config.mapBotScatteringIncreasePercentage
        );
    });
}

function increaseValueByPercentage(value: number, percentage: number): number {
    const increment = (value / 100) * percentage;
    return value + increment;
}

function mapsSpawnTunning(
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
                        locationBase.BotMax += Math.ceil(
                            locationBase.BotMax *
                                (config.mapMaxBotBuffPercentage / 100)
                        );
                    }
                    //reduceSpawnPointDelay(locationBase);
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
    );
}
