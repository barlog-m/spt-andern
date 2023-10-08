import { DependencyContainer } from "tsyringe";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";
import { IPmcConfig } from "@spt-aki/models/spt/config/IPmcConfig";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IGlobals } from "@spt-aki/models/eft/common/IGlobals";

import config from "../config/config.json";

export function mapBotConfig(container: DependencyContainer): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");

    setMaxBotCap(configServer);
    setPmcBotDifficulty(configServer);
    if (config.botScatteringIncreasePercentage > 0) {
        ajustBotWeaponScattering(container);
    }
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

function ajustBotWeaponScattering(container: DependencyContainer): undefined {
    const databaseServer: DatabaseServer =
        container.resolve<DatabaseServer>("DatabaseServer");
    const globals: IGlobals = databaseServer.getTables().globals;
    globals.BotWeaponScatterings.forEach((scattering) => {
        scattering.PriorityScatter100meter = increaseValueByPercentage(
            scattering.PriorityScatter100meter,
            config.botScatteringIncreasePercentage
        );
        scattering.PriorityScatter10meter = increaseValueByPercentage(
            scattering.PriorityScatter10meter,
            config.botScatteringIncreasePercentage
        );
        scattering.PriorityScatter1meter = increaseValueByPercentage(
            scattering.PriorityScatter1meter,
            config.botScatteringIncreasePercentage
        );
    });
}

function increaseValueByPercentage(value: number, percentage: number): number {
    const increment = (value / 100) * percentage;
    return value + increment;
}
