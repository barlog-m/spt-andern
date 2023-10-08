import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ILocationData } from "@spt-aki/models/spt/server/ILocations";
import {
    ILocationBase,
    BossLocationSpawn,
} from "@spt-aki/models/eft/common/ILocationBase";

import * as config from "../config/config.json";

export function isFactoryOrLab(location: string): boolean {
    if (location === "factory4_day") {
        return true;
    } else if (location === "laboratory") {
        return true;
    } else {
        return false;
    }
}

export function mapsSpawnTuning(
    databaseServer: DatabaseServer,
    logger: ILogger
): undefined {
    const db: IDatabaseTables = databaseServer.getTables();
    Object.entries(db.locations).forEach(([locationName, locationObj]) => {
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

            if (config.bossChanceBuff != 0) {
                bossChanceChange(locationBase, logger);
            }
        }
    });
}

function reduceSpawnPointDelay(locationBase: ILocationBase): undefined {
    locationBase.SpawnPointParams.forEach((spawnPointParam) => {
        if (spawnPointParam.DelayToCanSpawnSec > 20) {
            spawnPointParam.DelayToCanSpawnSec = Math.round(
                spawnPointParam.DelayToCanSpawnSec / 2
            );
        }
    });
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
                    bossLocationSpawn.BossChance + config.bossChanceBuff
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
