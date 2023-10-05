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
        if (botConfig.maxBotCap[map] < config.mapMaxBotCapacity) {
            botConfig.maxBotCap[map] = config.mapMaxBotCapacity;
        }
    }
}

function setPmcBotDifficulty(configServer: ConfigServer): undefined {
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    pmcConfig.useDifficultyOverride = true;
    pmcConfig.difficulty = config.mapPmcBotDifficulty;
}
