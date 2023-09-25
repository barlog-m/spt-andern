import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { BotInventoryGenerator } from "@spt-aki/generators/BotInventoryGenerator";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt-aki/models/eft/common/tables/IBotType";
import { RaidInfo } from "./RaidInfo";
import { BotHeadwear } from "./BotHeadwear";

export default function registerBotInventoryGenerator(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botInventoryGenerator = container.resolve<BotInventoryGenerator>(
        "BotInventoryGenerator"
    );
    const botHeadwear = container.resolve<BotHeadwear>("AndernBotHeadwear");
    const raidInfo = container.resolve<RaidInfo>("AndernRaidInfo");

    container.afterResolution(
        "BotInventoryGenerator",
        (_t, result: BotInventoryGenerator) => {
            result.generateInventory = (
                sessionId: string,
                botJsonTemplate: IBotType,
                botRole: string,
                isPmc: boolean,
                botLevel: number
            ): PmcInventory => {
                const inventory = botInventoryGenerator.generateInventory(
                    sessionId,
                    botJsonTemplate,
                    botRole,
                    isPmc,
                    botLevel
                );

                if (isPmc && raidInfo.isNight) {
                    if (botLevel < 15) {
                        botHeadwear.tierOneHeadwearWithNvg(inventory);
                    } else if (botLevel >= 15 && botLevel < 28) {
                        botHeadwear.tierTwoHeadwearWithNvg(inventory);
                    } else if (botLevel >= 28 && botLevel < 40) {
                        botHeadwear.tierThreeHeadwearWithNvg(inventory);
                    } else {
                        botHeadwear.tierFourHeadwearWithNvg(inventory);
                    }

                    /*
                    logger.info(
                        `[Andern] PMC Bot headwear replaced ${JSON.stringify(
                            inventory.items
                        )}`
                    );
                    */
                }

                return inventory;
            };
        },
        { frequency: "Always" }
    );

    logger.info("[Andern] PMC Bot Inventory Generator registered");
}
