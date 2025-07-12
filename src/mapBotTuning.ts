import { DependencyContainer } from "tsyringe";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import {
    IHostilitySettings,
    IPmcConfig,
} from "@spt/models/spt/config/IPmcConfig";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IGlobals } from "@spt/models/eft/common/IGlobals";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILocation } from "@spt/models/eft/common/ILocation";
import {
    ILocationBase,
    IBossLocationSpawn,
} from "@spt/models/eft/common/ILocationBase";
import {
    IBotType,
    IDifficulties,
} from "@spt/models/eft/common/tables/IBotType";

import * as fs from "fs";

import config from "../config/config.json";
import { BotHelper } from "@spt/helpers/BotHelper";

const mapsToIgnore: string[] = [
    "develop",
    "hideout",
    "privatearea",
    "suburbs",
    "terminal",
    "town",
];

export function mapBotTuning(
    container: DependencyContainer,
    modPath: string,
    logger: ILogger
): undefined {
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

    if (config.mapIncreaseSpawnGroupsSize) {
        increaseSpawnGroupsSize(databaseTables, logger);
    }

    if (config.mapPmcBrainsConfig !== "default") {
        setPmcBrains(configServer, databaseTables, logger, modPath);
    }

    pmcBrainTuning(databaseTables);

    tuneScavs(container);
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

        const location: ILocation = locationObj;
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

            const locationBaseBotMaxDefault = locationBase.BotMax;

            locationBase.BotMax = Math.ceil(
                locationBase.BotMax * config.mapMaxBotBuffMultiplier
            );

            if (config.debug) {
                logger.info(
                    `[Andern] ${locationName}.Base.BotMax ${locationBaseBotMaxDefault} -> ${locationBase.BotMax}`
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
                `[Andern] botConfig.maxBotCap[${map}] ${botConfigMaxBotCapDefault} -> ${botConfig.maxBotCap[map]}`
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
            `[Andern] pmcConfig.difficulty: ${config.mapPmcBotDifficulty}`
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

        const location: ILocation = locationObj;
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

            if (config.mapBossDisablePartisan) {
                bossDisablePartisan(locationBase);
            }

            if (config.mapBossDisableGoons) {
                bossDisableGoons(locationBase);
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
            const bossLocationSpawn: IBossLocationSpawn = spawnObj;
            if (
                bossLocationSpawn.BossName !== "pmcUSEC" &&
                bossLocationSpawn.BossName !== "pmcBEAR" &&
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

                    if (
                        config.mapBossDisablePartisan &&
                        bossLocationSpawn.BossName === "bossPartisan"
                    ) {
                        bossLocationSpawn.BossChance = 0;
                    }

                    if (
                        config.mapBossDisableGoons &&
                        bossLocationSpawn.BossName === "bossKnight"
                    ) {
                        bossLocationSpawn.BossChance = 0;
                    }

                    logger.info(
                        `[Andern] location '${locationBase.Name}' boss '${bossLocationSpawn.BossName}' chance ${bossLocationSpawn.BossChance}`
                    );
                }
            }
        }
    );
}

function bossDisablePartisan(locationBase: ILocationBase): undefined {
    Object.entries(locationBase.BossLocationSpawn).forEach(
        ([spawnKey, spawnObj]) => {
            const bossLocationSpawn: IBossLocationSpawn = spawnObj;
            if (bossLocationSpawn.BossName === "bossPartisan") {
                bossLocationSpawn.BossChance = 0;
            }
        }
    );
}

function bossDisableGoons(locationBase: ILocationBase): undefined {
    Object.entries(locationBase.BossLocationSpawn).forEach(
        ([spawnKey, spawnObj]) => {
            const bossLocationSpawn: IBossLocationSpawn = spawnObj;
            if (bossLocationSpawn.BossName === "bossKnight") {
                bossLocationSpawn.BossChance = 0;
            }
        }
    );
}

function makePmcAlwaysHostile(
    configServer: ConfigServer,
    logger: ILogger
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

    util(pmcConfig.hostilitySettings["pmcusec"]);
    util(pmcConfig.hostilitySettings["pmcbear"]);

    function util(hostilitySettings: IHostilitySettings): undefined {
        hostilitySettings.bearEnemyChance = 100;
        hostilitySettings.usecEnemyChance = 100;
        hostilitySettings.savageEnemyChance = 100;
        hostilitySettings.savagePlayerBehaviour = "AlwaysEnemies";
        hostilitySettings.chancedEnemies.forEach((chancedEnemy) => {
            chancedEnemy.EnemyChance = 100;
        });

        for (const chanceEnimes of hostilitySettings.chancedEnemies) {
            chanceEnimes.EnemyChance = 100;
        }
    }

    if (config.debug) {
        logger.info(
            `[Andern] pmcConfig.chanceSameSideIsHostilePercent: ${JSON.stringify(
                pmcConfig.hostilitySettings
            )}`
        );
    }
}

function increaseSpawnGroupsSize(
    databaseTables: IDatabaseTables,
    logger: ILogger
): undefined {
    for (const [locationName, locationObj] of Object.entries(
        databaseTables.locations
    )) {
        const location: ILocation = locationObj;
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

function setPmcBrains(
    configServer: ConfigServer,
    databaseTables: IDatabaseTables,
    logger: ILogger,
    modPath: string
): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

    const pmcBrainsBear = loadPmcBrains(
        config.mapPmcBrainsConfig,
        "bear",
        modPath,
        logger
    );
    const pmcBrainsUsec = loadPmcBrains(
        config.mapPmcBrainsConfig,
        "usec",
        modPath,
        logger
    );

    for (const [locationName, locationObj] of Object.entries(
        databaseTables.locations
    )) {
        if (mapsToIgnore.includes(locationName)) {
            continue;
        }

        pmcConfig.pmcType["pmcbear"][locationName] = pmcBrainsBear;
        pmcConfig.pmcType["pmcusec"][locationName] = pmcBrainsUsec;
    }

    if (config.debug) {
        logger.info(
            `[Andern] PmcConfig.pmcType[pmcbear][every location] ${JSON.stringify(
                pmcBrainsBear
            )}`
        );
        logger.info(
            `[Andern] PmcConfig.pmcType[pmcusec][every location] ${JSON.stringify(
                pmcBrainsUsec
            )}`
        );
    }
}

function loadPmcBrains(
    brains: string,
    pmcType: string,
    modPath: string,
    logger: ILogger
): Record<string, number> {
    const brainsFileName = `${modPath}/brains/${pmcType}/${brains}.json`;
    try {
        const jsonData = fs.readFileSync(brainsFileName, "utf-8");
        const brainsData: Record<string, number> = {};
        Object.assign(brainsData, JSON.parse(jsonData));
        return brainsData;
    } catch (err) {
        logger.error(`[Andern] error read file '${brainsFileName}'`);
        logger.error(err.message);
    }
}

function pmcBrainTuning(databaseTables: IDatabaseTables): undefined {
    ["usec", "pmcusec", "bear", "pmcbear"].forEach((botTypeName) => {
        const botType: IBotType = databaseTables.bots.types[botTypeName];
        brainTunning(botType.difficulty);
    });
}

function brainTunning(difficulty: IDifficulties): undefined {
    if (config.mapBotDisablePmcTalkativeness) {
        difficulty.normal.Mind["CAN_TALK"] = false;
        difficulty.normal.Mind["TALK_WITH_QUERY"] = false;

        difficulty.hard.Mind["CAN_TALK"] = false;
        difficulty.hard.Mind["TALK_WITH_QUERY"] = false;

        difficulty.impossible.Mind["CAN_TALK"] = false;
        difficulty.impossible.Mind["TALK_WITH_QUERY"] = false;
    }
}

function tuneScavs(container: DependencyContainer): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
    const botHelper = container.resolve<BotHelper>("BotHelper");

    const assaultJson = botHelper.getBotTemplate("assault");
    const equipmentChances = assaultJson.chances.equipment;

    if (config.mapScavsAlwaysHasArmor) {
        const assaultEquipment = botConfig.equipment["assault"];
        assaultEquipment.forceOnlyArmoredRigWhenNoArmor = true;

        equipmentChances.ArmorVest = 100;
    }

    if (config.mapScavsAlwaysHasBackpack) {
        equipmentChances.Backpack = 100;
    }

    if (config.mapScavsAlwaysHasHeadwear) {
        equipmentChances.Headwear = 100;
    }

    if (config.mapPlayerScavsBossBrainsOff) {
        Object.keys(botConfig.playerScavBrainType).forEach((map: string) => {
            botConfig.playerScavBrainType[map] = { assault: 1, pmcBot: 1 };
        });
    }
}
