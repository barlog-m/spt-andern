import {DependencyContainer} from "tsyringe"
import {BotLootGenerator} from "@spt-aki/generators/BotLootGenerator";
import {IBotType} from "@spt-aki/models/eft/common/tables/IBotType";
import {
    Inventory as PmcInventory
} from "@spt-aki/models/eft/common/tables/IBotBase";
import {ILogger} from "@spt-aki/models/spt/utils/ILogger";
import {LootGenerator} from "./lootGenerator"
import {RaidInfo} from "./RaidInfo";

export default function registerBotLootGenerator(
    container: DependencyContainer
): undefined {

    const logger = container.resolve<ILogger>("WinstonLogger");

    const botLootGenerator = container.resolve<BotLootGenerator>(
        "BotLootGenerator"
    );

    const lootGenerator = container.resolve<LootGenerator>(
        "AndernLootGenerator"
    )

    const raidInfo = container.resolve<RaidInfo>(
        "AndernRaidInfo"
    )

    container.afterResolution(
        "BotLootGenerator",
        (_t, result: BotLootGenerator) => {
            result.generateLoot = (
                sessionId: string,
                botJsonTemplate: IBotType,
                isPmc: boolean,
                botRole: string,
                botInventory: PmcInventory,
                botLevel: number
            ) => {
                return lootGenerator.generateLoot(sessionId, botJsonTemplate, isPmc, botRole, botInventory, botLevel, raidInfo);
            }
        },
        {frequency: "Always"}
    )

    logger.info("[Andern] PMC Bot Loot Generator registered")
}
