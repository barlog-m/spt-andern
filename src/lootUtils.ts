import {DependencyContainer} from "tsyringe";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {ConfigServer} from "@spt/servers/ConfigServer";
import {ConfigTypes} from "@spt/models/enums/ConfigTypes";
import {ItemHelper} from "@spt/helpers/ItemHelper";
import {Spawnpoint} from "@spt/models/eft/common/ILooseLoot";
import {BaseClasses} from "@spt/models/enums/BaseClasses";
import {ILocationConfig} from "@spt/models/spt/config/ILocationConfig";
import {IDatabaseTables} from "@spt/models/spt/server/IDatabaseTables";
import {ILocations} from "@spt/models/spt/server/ILocations";
import {ILocation, IStaticLootDetails} from "@spt/models/eft/common/ILocation";
import {Item} from "@spt/models/eft/common/tables/IItem";
import {IScavCaseConfig} from "@spt/models/spt/config/IScavCaseConfig";

import config from "../config/config.json";

// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_KEYS_RELATIVE_PROBABILITY_THRESHOLD = 4;
// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_KEYS_RELATIVE_PROBABILITY_MULTIPLIER = 8;
// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_KEYS_SPAWN_POINT_PROBABILITY = 0.1;

// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_CARDS_RELATIVE_PROBABILITY_THRESHOLD = 4;
// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_CARDS_RELATIVE_PROBABILITY_MULTIPLIER = 8;
// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_CARDS_SPAWN_POINT_PROBABILITY = 0.1;

// eslint-disable-next-line @typescript-eslint/naming-convention
const STATIC_LOOT_KEYS_RELATIVE_PROBABILITY = 1500;

// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_RARE_ITEMS_RELATIVE_PROBABILITY_THRESHOLD = 4;
// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_RARE_ITEMS_RELATIVE_PROBABILITY_MULTIPLIER = 8;
// eslint-disable-next-line @typescript-eslint/naming-convention
const LOOSE_LOOT_RARE_ITEMS_SPAWN_POINT_PROBABILITY = 0.8;

// eslint-disable-next-line @typescript-eslint/naming-convention
const RARE_ITEMS = [
    "6389c7f115805221fb410466",
    "6389c85357baa773a825b356",
    "5d0378d486f77420421a5ff4",
    "5c052f6886f7746b1e3db148",
    "6389c7750ef44505c87f5996",
    "6389c92d52123d5dd17f8876",
    "6389c8fb46b54c634724d847",
    "5c0530ee86f774697952d952",
    "5c052fb986f7746b2101e909",
    "5c05308086f7746b2101e90b",
]

// eslint-disable-next-line @typescript-eslint/naming-convention
const LOCATIONS = [
    "laboratory",
    "lighthouse"
]

// eslint-disable-next-line @typescript-eslint/naming-convention
const IGNORE_LOCATIONS = [
    "base",
    "develop",
    "hideout",
    "privatearea",
    "suburbs",
    "terminal",
    "town",
];

export function lootConfig(container: DependencyContainer): undefined {
    const databaseServer: DatabaseServer =
        container.resolve<DatabaseServer>("DatabaseServer");
    setLootMultiplier(container);
    setScavCaseLootValueMultiplier(container);

    if (config.increaseStaticLootKeysSpawn) {
        increaseStaticLootKeysSpawn(container, databaseServer);
    }

    if (config.increaseLooseLootKeysSpawn) {
        increaseLooseLootKeysSpawn(container, databaseServer);
    }

    if (config.increaseLooseLootCardsSpawn) {
        increaseLooseLootCardsSpawn(container, databaseServer);
    }

    if (config.increaseRareLootSpawn) {
        increaseRareLooseLootSpawn(container, databaseServer);
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

function increaseStaticLootKeysSpawn(
    container: DependencyContainer,
    databaseServer: DatabaseServer
): undefined {
    const drawers = ["578f87b7245977356274f2cd"];
    const jackets = [
        "578f8778245977358849a9b5",
        "5914944186f774189e5e76c2",
        "59387ac686f77401442ddd61",
        "5937ef2b86f77408a47244b3"
    ];
    const containers = [...drawers, ...jackets];

    const itemHelper = container.resolve<ItemHelper>("ItemHelper");
    const database: IDatabaseTables = databaseServer.getTables();

    for (const [locationName, locationObj] of Object.entries(database.locations)) {
        if (IGNORE_LOCATIONS.includes(locationName)) {
            continue;
        }

        const staticLootDistribution: Record<string, IStaticLootDetails>
            = locationObj.staticLoot;

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
                            STATIC_LOOT_KEYS_RELATIVE_PROBABILITY
                        ) {
                            if (config.debug) {
                                console.log(`[Andern] ${itemDistribution.tpl} relative probability ${itemDistribution.relativeProbability} -> ${STATIC_LOOT_KEYS_RELATIVE_PROBABILITY}`);
                            }
                            itemDistribution.relativeProbability =
                                STATIC_LOOT_KEYS_RELATIVE_PROBABILITY;
                        }
                    }
                });
            }
        );
    }
}

function increaseLooseLootProbabilityForKeysAndCards(
    itemHelper: ItemHelper,
    spawnPoint: Spawnpoint,
    itemClass: BaseClasses,
    targetProbability: number,
    probabilityThreshold: number,
    probabilityMultiplier: number
): undefined {
    const items: Item[] = spawnPoint.template.Items.filter((item) =>
        itemHelper.isOfBaseclass(item._tpl, itemClass)
    );
    items.forEach((item) => {
        const itemDistribution = spawnPoint.itemDistribution.find(
            (i) => i.composedKey.key === item._id
        );
        if (itemDistribution) {
            if (spawnPoint.probability < targetProbability) {
                spawnPoint.probability = targetProbability;
            }

            if (
                itemDistribution.relativeProbability <
                probabilityThreshold
            ) {
                itemDistribution.relativeProbability *=
                    probabilityMultiplier;
            }
        }
    });
}

function increaseLooseLootKeysSpawn(
    container: DependencyContainer,
    databaseServer: DatabaseServer
): undefined {
    const itemHelper = container.resolve<ItemHelper>("ItemHelper");
    const database: IDatabaseTables = databaseServer.getTables();
    const locations: ILocations = database.locations;

    Object.entries(locations).forEach(([locationName, location]) => {
        if (location.looseLoot) {
            location.looseLoot?.spawnpoints.forEach((spawnPoint: Spawnpoint) => {
                increaseLooseLootProbabilityForKeysAndCards(
                    itemHelper,
                    spawnPoint,
                    BaseClasses.KEY_MECHANICAL,
                    LOOSE_LOOT_KEYS_SPAWN_POINT_PROBABILITY,
                    LOOSE_LOOT_KEYS_RELATIVE_PROBABILITY_THRESHOLD,
                    LOOSE_LOOT_KEYS_RELATIVE_PROBABILITY_MULTIPLIER
                );
            });
        }
    });
}

function increaseLooseLootCardsSpawn(
    container: DependencyContainer,
    databaseServer: DatabaseServer
): undefined {
    const itemHelper = container.resolve<ItemHelper>("ItemHelper");
    const database: IDatabaseTables = databaseServer.getTables();
    const locations: ILocations = database.locations;

    Object.entries(locations).forEach(([locationName, location]) => {
        if (location.looseLoot) {
            location.looseLoot?.spawnpoints.forEach((spawnPoint: Spawnpoint) => {
                increaseLooseLootProbabilityForKeysAndCards(
                    itemHelper,
                    spawnPoint,
                    BaseClasses.KEYCARD,
                    LOOSE_LOOT_CARDS_SPAWN_POINT_PROBABILITY,
                    LOOSE_LOOT_CARDS_RELATIVE_PROBABILITY_THRESHOLD,
                    LOOSE_LOOT_CARDS_RELATIVE_PROBABILITY_MULTIPLIER
                );
            });
        }
    });
}

function increaseRareLooseLootSpawn(container: DependencyContainer, databaseServer: DatabaseServer) {
    const database: IDatabaseTables = databaseServer.getTables();
    const locations: ILocation[] = Object.entries(database.locations)
        .filter(([locationName, locationData]) => LOCATIONS.includes(locationName))
        .map(([locationName, locationData]) => locationData);


    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const locationConfig: ILocationConfig = configServer.getConfig(
        ConfigTypes.LOCATION
    );

    LOCATIONS.forEach((locationName) => increaseLocationLooseLootMultiplier(locationName, locationConfig))

    increaseLooseLootRareItemsSpawnChance(locations);
}

function increaseLooseLootRareItemsSpawnChance(
    locations: ILocation[]
): undefined {
    locations.forEach((location: ILocation) => {
        if (location.looseLoot) {
            location.looseLoot?.spawnpoints.forEach((spawnPoint: Spawnpoint) => {
                increaseLooseLootProbability(
                    spawnPoint,
                    RARE_ITEMS,
                    LOOSE_LOOT_RARE_ITEMS_SPAWN_POINT_PROBABILITY,
                    LOOSE_LOOT_RARE_ITEMS_RELATIVE_PROBABILITY_THRESHOLD,
                    LOOSE_LOOT_RARE_ITEMS_RELATIVE_PROBABILITY_MULTIPLIER
                );
            });
        }
    });
}

function increaseLooseLootProbability(
    spawnPoint: Spawnpoint,
    itemFilter: string[],
    targetProbability: number,
    probabilityThreshold: number,
    probabilityMultiplier: number
): undefined {
    const itemsToIncreaseSpawn: Item[] = spawnPoint.template.Items.filter((item) =>
        itemFilter.includes(item._tpl)
    );

    const itemsToDecreaseSpawn: Item[] = spawnPoint.template.Items.filter((item) =>
        !itemFilter.includes(item._tpl)
    );

    itemsToIncreaseSpawn.forEach((item) => {
        const itemDistribution = spawnPoint.itemDistribution.find(
            (i) => i.composedKey.key === item._id
        );
        if (itemDistribution) {
            if (spawnPoint.probability < targetProbability) {
                spawnPoint.probability = targetProbability;
            }

            if (itemDistribution.relativeProbability < probabilityThreshold) {
                itemDistribution.relativeProbability *=
                    probabilityMultiplier;
            }
        }
    });

    itemsToDecreaseSpawn.forEach((item) => {
        const itemDistribution = spawnPoint.itemDistribution.find(
            (i) => i.composedKey.key === item._id
        );
        if (itemDistribution) {
            if (itemDistribution.relativeProbability > probabilityThreshold) {
                itemDistribution.relativeProbability = Math.ceil(itemDistribution.relativeProbability /
                    probabilityMultiplier);
            }
        }
    });
}

function increaseLocationLooseLootMultiplier(locationName: string, locationConfig: ILocationConfig): undefined {
    locationConfig.looseLootMultiplier[locationName] *= 1.1;
}
