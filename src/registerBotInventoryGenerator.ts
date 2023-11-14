import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { BotInventoryGenerator } from "@spt-aki/generators/BotInventoryGenerator";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt-aki/models/eft/common/tables/IBotType";
import { RaidInfo } from "./RaidInfo";
import { GearGenerator } from "./GearGenerator";
import { fixBossSpecialLoot } from "./mapBotTuning";
import * as config from "../config/config.json";

export default function registerBotInventoryGenerator(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botInventoryGenerator = container.resolve<BotInventoryGenerator>(
        "BotInventoryGenerator"
    );
    const raidInfo = container.resolve<RaidInfo>("AndernRaidInfo");

    const gearGenerator = container.resolve<GearGenerator>(
        "AndernGearGenerator"
    );

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
                    const inventory = gearGenerator.generateInventory(
                        sessionId,
                        botJsonTemplate,
                        botRole,
                        isPmc,
                        botLevel,
                        raidInfo
                    );
                    return inventory;
                }

                if (config.fixBossSpecialLoot && botRole.startsWith("boss")) {
                    fixBossSpecialLoot(botJsonTemplate, botRole, logger);
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
