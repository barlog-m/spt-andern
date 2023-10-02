import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { Spawnpoint } from "@spt-aki/models/eft/common/ILooseLoot";
import { ItemDistribution } from "@spt-aki/models/eft/common/tables/ILootBase";
import { BaseClasses } from "@spt-aki/models/enums/BaseClasses";
import { ILocationConfig } from "@spt-aki/models/spt/config/ILocationConfig";

import config from "../config/config.json";

export function lootConfig(
    container: DependencyContainer,
    databaseServer: DatabaseServer
): undefined {
    setLootMultiplier(container);
    increaseKeysSpawnChance(container, databaseServer);
}

function setLootMultiplier(container: DependencyContainer) {
    const configServer = container.resolve<ConfigServer>("ConfigServer");

    const locatinConfig: ILocationConfig = configServer.getConfig(
        ConfigTypes.LOCATION
    );

    for (const map in locatinConfig.looseLootMultiplier) {
        locatinConfig.looseLootMultiplier[map] = config.looseLootMultiplier;
    }

    for (const map in locatinConfig.staticLootMultiplier) {
        locatinConfig.staticLootMultiplier[map] = config.staticLootMultiplier;
    }
}

function increaseKeysSpawnChance(
    container: DependencyContainer,
    databaseServer: DatabaseServer
): undefined {
    const itemHelper = container.resolve<ItemHelper>("ItemHelper");
    const database = databaseServer.getTables();
    const locations = database.locations;
    const staticLoot = database.loot.staticLoot;

    const relativeProbabilityThreshold = 3;
    const relativeProbabilityMultiplier = 20;
    const looseKeyProbability = 0.2;
    const looseCardProbability = 0.1;
    const staticRelativeProbability = 2000;

    for (const staticName in staticLoot) {
        const staticy: ItemDistribution[] =
            staticLoot[staticName]?.itemDistribution;
        if (!staticy) {
            continue;
        }
        for (const itemDistribution of staticy) {
            if (
                itemHelper.isOfBaseclass(
                    itemDistribution.tpl,
                    BaseClasses.KEY_MECHANICAL
                )
            ) {
                const matchingItem = staticy.find(
                    (s) => s.tpl === itemDistribution.tpl
                );
                if (matchingItem) {
                    if (
                        itemDistribution.relativeProbability <
                        staticRelativeProbability
                    ) {
                        itemDistribution.relativeProbability =
                            staticRelativeProbability;
                    }
                }
            }
        }
    }

    for (const mapId in locations) {
        const spawnPoints: Spawnpoint[] =
            locations[mapId]?.looseLoot?.spawnpoints;
        if (!spawnPoints) {
            continue;
        }
        for (const spawnPoint of spawnPoints) {
            for (const item of spawnPoint.template.Items) {
                if (
                    itemHelper.isOfBaseclass(
                        item._tpl,
                        BaseClasses.KEY_MECHANICAL
                    )
                ) {
                    const matchingItem = spawnPoint.itemDistribution.find(
                        (x) => x.composedKey.key === item._id
                    );
                    if (matchingItem) {
                        if (spawnPoint.probability < looseKeyProbability) {
                            spawnPoint.probability = looseKeyProbability;
                        }
                        if (
                            matchingItem.relativeProbability <
                            relativeProbabilityThreshold
                        ) {
                            matchingItem.relativeProbability *=
                                relativeProbabilityMultiplier;
                        }
                    }
                } else {
                    if (
                        itemHelper.isOfBaseclass(item._tpl, BaseClasses.KEYCARD)
                    ) {
                        const matchingItem = spawnPoint.itemDistribution.find(
                            (x) => x.composedKey.key === item._id
                        );
                        if (matchingItem) {
                            if (spawnPoint.probability < looseCardProbability) {
                                spawnPoint.probability = looseCardProbability;
                            }
                        }
                    }
                }
            }
        }
    }
}
