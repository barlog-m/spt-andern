import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ILocationData } from "@spt-aki/models/spt/server/ILocations";
import {
    ILocationBase,
    BossLocationSpawn,
} from "@spt-aki/models/eft/common/ILocationBase";

export function isFactoryOrLab(location: string): boolean {
    if (location === "factory4_day") {
        return true;
    } else if (location === "laboratory") {
        return true;
    } else {
        return false;
    }
}

export function bossChanceBuff(
    databaseServer: DatabaseServer,
    buff: number,
    logger: ILogger
): undefined {
    const db: IDatabaseTables = databaseServer.getTables();
    Object.entries(db.locations).forEach(([locationName, locationObj]) => {
        const location: ILocationData = locationObj;
        if (location.base) {
            const locationBase: ILocationBase = location.base;
            Object.entries(locationBase.BossLocationSpawn).forEach(
                ([spawnKey, spawnObj]) => {
                    let bossLocationSpawn: BossLocationSpawn = spawnObj;
                    if (bossLocationSpawn.BossChance > 0) {
                        let chance = Math.round(
                            bossLocationSpawn.BossChance + buff
                        );
                        if (chance > 100) {
                            chance = 100;
                        }
                        bossLocationSpawn.BossChance = chance;
                        logger.info(
                            `[Andern] location '${locationBase.Name}' boss '${bossLocationSpawn.BossName}' chance ${chance}`
                        );
                    }
                }
            );
        }
    });
}
