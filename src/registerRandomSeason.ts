import { DependencyContainer } from "tsyringe";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { setSeasonRandom } from "./seasonUtils";

export default function registerRandomSeason(
    container: DependencyContainer,
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const staticRouterModService = container.resolve<StaticRouterModService>(
        "StaticRouterModService",
    );

    staticRouterModService.registerStaticRouter(
        "AndernSeasonUpdate",
        [
            {
                url: "/client/match/local/end",
                action: (_url, _info, _sessionId, output) => {
                    return new Promise((resolve) => {
                        setSeasonRandom(container);
                        resolve(output);
                    });
                },
            },
        ],
        "spt",
    );

    logger.info("[Andern] Season randomizer registered");
}
