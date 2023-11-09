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
import pmcBrains from "../config/pmc.json";

const mapsToIgnore: string[] = [
    "develop",
    "hideout",
    "privatearea",
    "suburbs",
    "terminal",
    "town",
    "default",
];

export function mapBotTuning(container: DependencyContainer): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");

    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const databaseTables: IDatabaseTables = databaseServer.getTables();
    const globals: IGlobals = databaseServer.getTables().globals;

    if (config.mapMaxBotBuffMultiplier != 0) {
        setBotConfigMaxBotCap(configServer, logger);
        setLocationBaseBotMax(databaseTables, logger);
    }

    mapsTuning(databaseTables, logger);

    setPmcBotDifficulty(configServer, logger);

    if (config.mapBotAccuracyMultiplier != 0) {
        ajustBotWeaponScattering(globals, logger);
    }

    if (config.mapMakePmcAlwaysHostile) {
        makePmcAlwaysHostile(configServer, logger);
    }

    tuneScavConvertToPmcRatio(configServer, logger);

    disableScavConvertToPmc(configServer, logger);

    if (config.mapIncreaseSpawnGroupsSize) {
        increaseSpawnGroupsSize(databaseTables, logger);
    }

    if (config.mapPmcBrainsConfig) {
        limitPmcBrains(configServer, databaseTables, logger);
    }
}

function setLocationBaseBotMax(
    databaseTables: IDatabaseTables,
    logger: ILogger
): undefined {
    for (const [locationName, locationObj] of Object.entries(
        databaseTables.locations
    )) {
        if (mapsToIgnore.includes(locationName)) {
            continue;
        }

        const location: ILocationData = locationObj;
        if (location.base) {
            const locationBase: ILocationBase = location.base;

            if (
                config.mapMaxBotBuffExcludeFactory &&
                (locationName === "factory4_night" ||
                    locationName === "factory4_day")
            ) {
                continue;
            }

            if (
                config.mapMaxBotBuffExcludeLab &&
                locationName === "laboratory"
            ) {
                continue;
            }

            if (
                config.mapMaxBotBuffExcludeStreets &&
                locationName === "tarkovstreets"
            ) {
                continue;
            }

            // FIX for SPT-AKI 3.7.1
            if (locationName === "factory4_day") {
                locationBase.BotMax = 16;
            }

            const locationBaseBotMaxDefault = locationBase.BotMax;

            locationBase.BotMax = Math.ceil(
                locationBase.BotMax * config.mapMaxBotBuffMultiplier
            );

            if (config.debug) {
                logger.info(
                    `[Andern] ${locationName}.Base.BotMax ${locationBaseBotMaxDefault} >> ${locationBase.BotMax}`
                );
            }
        }
    }
}

function setBotConfigMaxBotCap(
    configServer: ConfigServer,
    logger: ILogger
): undefined {
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);

    for (const map in botConfig.maxBotCap) {
        if (mapsToIgnore.includes(map)) {
            continue;
        }

        // Streets performance fix
        if (map === "tarkovstreets" && config.mapStreetsMaxBotCap > 0) {
            botConfig.maxBotCap[map] = config.mapStreetsMaxBotCap;
            logger.info(
                `[Andern] FIX botConfig.maxBotCap[${map}] ${botConfig.maxBotCap[map]}`
            );
        }

        if (
            config.mapMaxBotBuffExcludeFactory &&
            (map === "factory4_night" || map === "factory4_day")
        ) {
            continue;
        }

        if (config.mapMaxBotBuffExcludeLab && map === "laboratory") {
            continue;
        }

        if (config.mapMaxBotBuffExcludeStreets && map === "tarkovstreets") {
            continue;
        }

        const botConfigMaxBotCapDefault = botConfig.maxBotCap[map];

        botConfig.maxBotCap[map] = Math.floor(
            botConfig.maxBotCap[map] * config.mapMaxBotBuffMultiplier
        );

        if (config.debug) {
            logger.info(
                `[Andern] botConfig.maxBotCap[${map}] ${botConfigMaxBotCapDefault} >> ${botConfig.maxBotCap[map]}`
            );
        }
    }
}

function setPmcBotDifficulty(
    configServer: ConfigServer,
    logger: ILogger
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.useDifficultyOverride = true;
    pmcConfig.difficulty = config.mapPmcBotDifficulty;
    if (config.debug) {
        logger.info(
            `[Andern] pmcConfig.difficulty = ${config.mapPmcBotDifficulty}`
        );
    }
}

export function setPmcForceHealingItems(
    container: DependencyContainer,
    logger: ILogger
): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.forceHealingItemsIntoSecure = true;
}

function ajustBotWeaponScattering(
    globals: IGlobals,
    logger: ILogger
): undefined {
    globals.BotWeaponScatterings.forEach((scattering) => {
        const divider = config.mapBotAccuracyMultiplier / 2;
        scattering.PriorityScatter100meter /= divider;
        scattering.PriorityScatter10meter /= divider;
        scattering.PriorityScatter1meter /= divider;
    });
}

function mapsTuning(
    databaseTables: IDatabaseTables,
    logger: ILogger
): undefined {
    for (const [locationName, locationObj] of Object.entries(
        databaseTables.locations
    )) {
        if (mapsToIgnore.includes(locationName)) {
            continue;
        }

        const location: ILocationData = locationObj;
        if (location.base) {
            const locationBase: ILocationBase = location.base;

            if (config.mapBotAccuracyMultiplier != 1) {
                locationBase.BotLocationModifier.AccuracySpeed *=
                    config.mapBotAccuracyMultiplier;
                locationBase.BotLocationModifier.Scattering /=
                    config.mapBotAccuracyMultiplier;
            }

            if (config.mapBossChanceBuff != 0) {
                bossChanceChange(locationBase, logger);
            }
        }
    }
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

function makePmcAlwaysHostile(
    configServer: ConfigServer,
    logger: ILogger
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.chanceSameSideIsHostilePercent = 100;
    if (config.debug) {
        logger.info(
            `[Andern] pmcConfig.chanceSameSideIsHostilePercent: ${pmcConfig.chanceSameSideIsHostilePercent}`
        );
    }
}

function tuneScavConvertToPmcRatio(
    configServer: ConfigServer,
    logger: ILogger
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

    for (const botType in pmcConfig.convertIntoPmcChance) {
        pmcConfig.convertIntoPmcChance[botType].min = Math.ceil(
            pmcConfig.convertIntoPmcChance[botType].min *
                config.mapScavToPmcConvertMultiplier
        );
        pmcConfig.convertIntoPmcChance[botType].max = Math.ceil(
            pmcConfig.convertIntoPmcChance[botType].max *
                config.mapScavToPmcConvertMultiplier
        );
    }
}

function disableScavConvertToPmc(
    configServer: ConfigServer,
    logger: ILogger
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

    if (config.mapDisableRaiderConvertToPmc) {
        const botType = "pmcbot";
        disableBotTypeConvertToPmc(botType, pmcConfig, logger);
    }

    if (config.mapDisableRogueConvertToPmc) {
        const botType = "exusec";
        disableBotTypeConvertToPmc(botType, pmcConfig, logger);
    }
}

function disableBotTypeConvertToPmc(
    botType: string,
    pmcConfig: IPmcConfig,
    logger: ILogger
): undefined {
    pmcConfig.convertIntoPmcChance[botType] = { min: 0, max: 0 };
}

function increaseSpawnGroupsSize(
    databaseTables: IDatabaseTables,
    logger: ILogger
): undefined {
    for (const [locationName, locationObj] of Object.entries(
        databaseTables.locations
    )) {
        const location: ILocationData = locationObj;
        if (location.base) {
            const locationBase: ILocationBase = location.base;
            if (
                config.mapMaxBotBuffExcludeFactory &&
                (locationName === "factory4_night" ||
                    locationName === "factory4_day")
            ) {
                continue;
            }

            if (
                config.mapMaxBotBuffExcludeLab &&
                locationName === "laboratory"
            ) {
                continue;
            }

            if (
                config.mapMaxBotBuffExcludeStreets &&
                locationName === "tarkovstreets"
            ) {
                continue;
            }

            locationBase.waves.forEach((wave) => {
                if (wave.slots_max < 3) {
                    wave.slots_max = 3;
                }
            });
        }
    }
}

function limitPmcBrains(
    configServer: ConfigServer,
    databaseTables: IDatabaseTables,
    logger: ILogger
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

    for (const [locationName, locationObj] of Object.entries(
        databaseTables.locations
    )) {
        if (mapsToIgnore.includes(locationName)) {
            continue;
        }

        pmcConfig.pmcType["sptbear"][locationName] = pmcBrains;
        pmcConfig.pmcType["sptusec"][locationName] = pmcBrains;
    }

    if (config.debug) {
        logger.info(
            `[Andern] PmcConfig.pmcType[every pmc][every location] ${JSON.stringify(
                pmcBrains
            )}`
        );
    }
}
