import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { BotInventoryGenerator } from "@spt-aki/generators/BotInventoryGenerator";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt-aki/models/eft/common/tables/IBotType";
import { RaidInfo } from "./RaidInfo";
import { TierOneGear } from "./TierOneGear";
import { TierTwoGear } from "./TierTwoGear";
import { TierThreeGear } from "./TierThreeGear";
import { TierFourGear } from "./TierFourGear";

export default function registerBotInventoryGenerator(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botInventoryGenerator = container.resolve<BotInventoryGenerator>(
        "BotInventoryGenerator"
    );
    const raidInfo = container.resolve<RaidInfo>("AndernRaidInfo");

    const tierOneGear = container.resolve<TierOneGear>("AndernTierOneGear");
    const tierTwoGear = container.resolve<TierTwoGear>("AndernTierTwoGear");
    const tierThreeGear = container.resolve<TierThreeGear>(
        "AndernTierThreeGear"
    );
    const tierFourGear = container.resolve<TierFourGear>("AndernTierFourGear");

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
                if (isPmc) {
                    if (botLevel < 15) {
                        const inventory = tierOneGear.generateInventory(
                            sessionId,
                            botJsonTemplate,
                            botRole,
                            isPmc,
                            botLevel,
                            raidInfo.isNight
                        );
                        return inventory;
                    } else if (botLevel >= 15 && botLevel < 28) {
                        const inventory = tierTwoGear.generateInventory(
                            sessionId,
                            botJsonTemplate,
                            botRole,
                            isPmc,
                            botLevel,
                            raidInfo.isNight
                        );
                        return inventory;
                    } else if (botLevel >= 28 && botLevel < 40) {
                        const inventory = tierThreeGear.generateInventory(
                            sessionId,
                            botJsonTemplate,
                            botRole,
                            isPmc,
                            botLevel,
                            raidInfo.isNight
                        );
                        return inventory;
                    } else {
                        const inventory = tierFourGear.generateInventory(
                            sessionId,
                            botJsonTemplate,
                            botRole,
                            isPmc,
                            botLevel,
                            raidInfo.isNight
                        );
                        return inventory;
                    }
                }

                return botInventoryGenerator.generateInventory(
                    sessionId,
                    botJsonTemplate,
                    botRole,
                    isPmc,
                    botLevel
                );
            };
        },
        { frequency: "Always" }
    );

    logger.info("[Andern] PMC Bot Inventory Generator registered");
}
