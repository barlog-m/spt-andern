import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IBotBase } from "@spt/models/eft/common/tables/IBotBase";
import { BotGenerationDetails } from "@spt/models/spt/bots/BotGenerationDetails";
import { IRandomisedBotLevelResult } from "@spt/models/eft/bot/IRandomisedBotLevelResult";
import { MinMax } from "@spt/models/common/MinMax";
import { BotLevelGenerator } from "@spt/generators/BotLevelGenerator";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";
import { RandomUtil } from "@spt/utils/RandomUtil";
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
                    const min =
                        config.pmcBotMinLevel <= 0 ? 1 : config.pmcBotMinLevel;
                    const max =
                        config.pmcBotMaxLevel >= 71
                            ? 71
                            : config.pmcBotMaxLevel;
                    level = randomUtil.getInt(min, max);
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
