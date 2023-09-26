import { DependencyContainer } from "tsyringe";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { WeatherGenerator } from "@spt-aki/generators/WeatherGenerator";
import { RaidInfo } from "./RaidInfo";
import { isNight, getCurrentTime } from "./timeUtils";

export default function registerInfoUpdater(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const staticRouterModService = container.resolve<StaticRouterModService>(
        "StaticRouterModService"
    );
    const weatherGenerator =
        container.resolve<WeatherGenerator>("WeatherGenerator");
    const raidInfo = container.resolve<RaidInfo>("AndernRaidInfo");

    staticRouterModService.registerStaticRouter(
        "AndernRaidInfoUpdater",
        [
            {
                url: "/client/raid/configuration",
                action: (_url, info, _sessionId, output) => {
                    raidInfo.location = info.location.toLowerCase();
                    raidInfo.currentTime = getCurrentTime(weatherGenerator);
                    raidInfo.timeVariant = info.timeVariant;
                    raidInfo.isNight = isNight(
                        raidInfo.currentTime,
                        raidInfo.timeVariant,
                        raidInfo.location
                    );
                    logger.info(
                        `[Andern] raid info ${JSON.stringify(raidInfo)}`
                    );
                    return output;
                },
            },
        ],
        "aki"
    );

    logger.info("[Andern] Map Info updater registered");
}
