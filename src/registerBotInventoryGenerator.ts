import { DependencyContainer } from "tsyringe";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { BotInventoryGenerator } from "@spt/generators/BotInventoryGenerator";
import { IInventory as PmcInventory } from "@spt/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt/models/eft/common/tables/IBotType";
import { RaidInfo } from "./RaidInfo";
import { GearGenerator } from "./GearGenerator";

export default function registerBotInventoryGenerator(
    container: DependencyContainer,
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botInventoryGenerator = container.resolve<BotInventoryGenerator>(
        "BotInventoryGenerator",
    );
    const raidInfo = container.resolve<RaidInfo>("AndernRaidInfo");

    const gearGenerator = container.resolve<GearGenerator>(
        "AndernGearGenerator",
    );

    container.afterResolution(
        "BotInventoryGenerator",
        (_t, result: BotInventoryGenerator) => {
            result.generateInventory = (
                sessionId: string,
                botJsonTemplate: IBotType,
                botRole: string,
                isPmc: boolean,
                botLevel: number,
                chosenGameVersion: string,
            ): PmcInventory => {
                if (isPmc) {
                    const inventory = gearGenerator.generateInventory(
                        sessionId,
                        botJsonTemplate,
                        botRole,
                        isPmc,
                        botLevel,
                        raidInfo,
                        chosenGameVersion,
                    );
                    return inventory;
                }

                return botInventoryGenerator.generateInventory(
                    sessionId,
                    botJsonTemplate,
                    botRole,
                    isPmc,
                    botLevel,
                    chosenGameVersion,
                );
            };
        },
        { frequency: "Always" },
    );

    logger.info("[Andern] PMC Bot Inventory Generator registered");
}
