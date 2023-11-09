import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { IBotBase } from "@spt-aki/models/eft/common/tables/IBotBase";
import { BotGenerationDetails } from "@spt-aki/models/spt/bots/BotGenerationDetails";
import { IRandomisedBotLevelResult } from "@spt-aki/models/eft/bot/IRandomisedBotLevelResult";
import { MinMax } from "@spt-aki/models/common/MinMax";
import { BotLevelGenerator } from "@spt-aki/generators/BotLevelGenerator";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import * as config from "../config/config.json";

export default function registerBotLevelGenerator(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botLevelGenerator =
        container.resolve<BotLevelGenerator>("BotLevelGenerator");
    const profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
    const randomUtil = container.resolve<RandomUtil>("RandomUtil");

    container.afterResolution(
        "BotLevelGenerator",
        (_t, result: BotLevelGenerator) => {
            result.generateBotLevel = (
                levelDetails: MinMax,
                botGenerationDetails: BotGenerationDetails,
                bot: IBotBase
            ): IRandomisedBotLevelResult => {
                if (!botGenerationDetails.isPmc)
                    return botLevelGenerator.generateBotLevel(
                        levelDetails,
                        botGenerationDetails,
                        bot
                    );

                const { playerLevel } = botGenerationDetails;

                let level = 1;

                if (config.useFixedPmcBotLevelRange) {
                    level = randomUtil.getInt(
                        config.pmcBotMinLevel,
                        config.pmcBotMaxLevel
                    );
                } else {
                    const downDelta = config.pmcBotLevelDownDelta;
                    const upDelta = config.pmcBotLevelUpDelta;
                    const min =
                        playerLevel - downDelta <= 0
                            ? 1
                            : playerLevel - downDelta;
                    const max =
                        playerLevel + upDelta >= 71
                            ? 71
                            : playerLevel + upDelta;
                    level = randomUtil.getInt(min, max);
                }

                const res: IRandomisedBotLevelResult = {
                    level,
                    exp: profileHelper.getExperience(level),
                };

                if (config.debug)
                    logger.info(
                        `[Andern] generated pmc ${JSON.stringify(res)}`
                    );

                return res;
            };
        },
        { frequency: "Always" }
    );
    logger.info("[Andern] PMC Bot Level Generator registered");
}
