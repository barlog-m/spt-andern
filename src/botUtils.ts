import { DependencyContainer } from "tsyringe";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";
import { IPmcConfig } from "@spt-aki/models/spt/config/IPmcConfig";

import config from "../config/config.json";

export function mapBotConfig(container: DependencyContainer): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");

    setMaxBotCap(configServer);
    setPmcBotDifficulty(configServer);
}

function setMaxBotCap(configServer: ConfigServer): undefined {
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);

    for (const map in botConfig.maxBotCap) {
        if (map === "factory4_night" || map === "laboratory") continue;
        if (botConfig.maxBotCap[map] < config.mapMaxBotBuffPercentage) {
            botConfig.maxBotCap[map] += Math.ceil(
                botConfig.maxBotCap[map] *
                    (config.mapMaxBotBuffPercentage / 100)
            );
        }
    }
}

function setPmcBotDifficulty(configServer: ConfigServer): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.useDifficultyOverride = true;
    pmcConfig.difficulty = config.mapPmcBotDifficulty;
}
