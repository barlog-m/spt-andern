import {DependencyContainer} from "tsyringe";
import {DatabaseServer} from "@spt-aki/servers/DatabaseServer";
import {ConfigServer} from "@spt-aki/servers/ConfigServer";
import {ConfigTypes} from "@spt-aki/models/enums/ConfigTypes";
import {ItemHelper} from "@spt-aki/helpers/ItemHelper";
import {Spawnpoint} from "@spt-aki/models/eft/common/ILooseLoot";
import {BaseClasses} from "@spt-aki/models/enums/BaseClasses";
import {ILocationConfig} from "@spt-aki/models/spt/config/ILocationConfig";
import {IDatabaseTables} from "@spt-aki/models/spt/server/IDatabaseTables";
import {ILocations} from "@spt-aki/models/spt/server/ILocations";
import {IStaticLootDetails} from "@spt-aki/models/eft/common/tables/ILootBase";
import {Item} from "@spt-aki/models/eft/common/tables/IItem";
import {IScavCaseConfig} from "@spt-aki/models/spt/config/IScavCaseConfig";

import config from "../config/config.json";

export function lootConfig(container: DependencyContainer): undefined {
    const databaseServer: DatabaseServer =
        container.resolve<DatabaseServer>("DatabaseServer");
    setLootMultiplier(container);
    setScavCaseLootValueMultiplier(container);

    if (config.looseLootKeyAndCardsSettings) {
        increaseKeysSpawnChance(container, databaseServer);
    }
}

function setLootMultiplier(container: DependencyContainer): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");

    const locationConfig: ILocationConfig = configServer.getConfig(
        ConfigTypes.LOCATION
    );

    for (const map in locationConfig.looseLootMultiplier) {
        locationConfig.looseLootMultiplier[map] *= config.looseLootMultiplier;
    }

    for (const map in locationConfig.staticLootMultiplier) {
        locationConfig.staticLootMultiplier[map] *= config.staticLootMultiplier;
    }
}

function increaseStaticLootKeysSpawnChance(
    staticLootDistribution: Record<string, IStaticLootDetails>,
    itemHelper: ItemHelper
): undefined {
    const drawers = ["578f87b7245977356274f2cd"];
    const jackets = [
        "578f8778245977358849a9b5",
        "5914944186f774189e5e76c2",
        "59387ac686f77401442ddd61",
        "5937ef2b86f77408a47244b3"
    ];
    const containers = [...drawers, ...jackets];

    const drawersAndJackets = Object.fromEntries(
        Object.entries(staticLootDistribution).filter(
            ([staticLootTpl, staticLootDetails]) => {
                return (
                    staticLootDetails.itemDistribution &&
                    containers.includes(staticLootTpl)
                );
            }
        )
    );

    Object.entries(drawersAndJackets).forEach(
        ([staticLootTpl, staticLootDetails]) => {
            staticLootDetails.itemDistribution.forEach((itemDistribution) => {
                if (
                    itemHelper.isOfBaseclass(
                        itemDistribution.tpl,
                        BaseClasses.KEY_MECHANICAL
                    )
                ) {
                    if (
                        itemDistribution.relativeProbability <
                        config.staticLootKeysRelativeProbability
                    ) {
                        if (config.debug) {
                            console.log(`[Andern] ${itemDistribution.tpl} relative probability ${itemDistribution.relativeProbability} -> ${config.staticLootKeysRelativeProbability}`);
                        }
                        itemDistribution.relativeProbability =
                            config.staticLootKeysRelativeProbability;
                    }
                }
            });
        }
    );
}

function increaseLooseLootKeysProbability(
    itemHelper: ItemHelper,
    targetProbability: number,
    spawnPoint: Spawnpoint,
    itemClass: BaseClasses
): undefined {
    const keyItems: Item[] = spawnPoint.template.Items.filter((item) =>
        itemHelper.isOfBaseclass(item._tpl, itemClass)
    );
    keyItems.forEach((keyItem) => {
        const keyDistribution = spawnPoint.itemDistribution.find(
            (i) => i.composedKey.key === keyItem._id
        );
        if (keyDistribution) {
            if (spawnPoint.probability < targetProbability) {
                spawnPoint.probability = targetProbability;
            }
            if (
                keyDistribution.relativeProbability <
                config.looseLootKeysRelativeProbabilityThreshold
            ) {
                keyDistribution.relativeProbability *=
                    config.looseLootKeysRelativeProbabilityMultiplier;
            }
        }
    });
}

function increaseLooseLootKeysAndCardsSpawnChance(
    locations: ILocations,
    itemHelper: ItemHelper
): undefined {
    const looseLootKeysProbability = config.looseLootKeysPercentage / 100;
    const looseLootCardsProbability = config.looseLootCardsPercentage / 100;

    Object.entries(locations).forEach(([locationName, location]) => {
        if (location.looseLoot) {
            location.looseLoot?.spawnpoints.forEach((spawnPoint) => {
                increaseLooseLootKeysProbability(
                    itemHelper,
                    looseLootKeysProbability,
                    spawnPoint,
                    BaseClasses.KEY_MECHANICAL
                );
                increaseLooseLootKeysProbability(
                    itemHelper,
                    looseLootCardsProbability,
                    spawnPoint,
                    BaseClasses.KEYCARD
                );
            });
        }
    });
}

function increaseKeysSpawnChance(
    container: DependencyContainer,
    databaseServer: DatabaseServer
): undefined {
    const itemHelper = container.resolve<ItemHelper>("ItemHelper");
    const database: IDatabaseTables = databaseServer.getTables();
    const locations: ILocations = database.locations;
    const staticLootDistribution = database.loot.staticLoot;

    increaseStaticLootKeysSpawnChance(staticLootDistribution, itemHelper);
    increaseLooseLootKeysAndCardsSpawnChance(locations, itemHelper);
}

function setScavCaseLootValueMultiplier(
    container: DependencyContainer
): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const scavCaseConfig = configServer.getConfig<IScavCaseConfig>(
        ConfigTypes.SCAVCASE
    );

    scavCaseConfig.allowBossItemsAsRewards = true;

    for (const valueRange in scavCaseConfig.rewardItemValueRangeRub) {
        scavCaseConfig.rewardItemValueRangeRub[valueRange].min *=
            config.scavCaseLootValueMultiplier;
        scavCaseConfig.rewardItemValueRangeRub[valueRange].max *=
            config.scavCaseLootValueMultiplier;
    }
}
