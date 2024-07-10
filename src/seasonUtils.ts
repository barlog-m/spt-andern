import {Season} from "@spt/models/enums/Season";
import {DependencyContainer} from "tsyringe";
import {ConfigServer} from "@spt/servers/ConfigServer";
import {IWeatherConfig} from "@spt/models/spt/config/IWeatherConfig";
import {ConfigTypes} from "@spt/models/enums/ConfigTypes";
import {RandomUtil} from "@spt/utils/RandomUtil";
import * as config from "../config/config.json";

export function getSeasonByName(seasonName: string): Season | undefined {
    const seasonNameUpperCase = seasonName.toUpperCase();
    if (seasonNameUpperCase === "SUMMER") {
        return Season.SUMMER;
    } else if (seasonNameUpperCase === "AUTUMN") {
        return Season.AUTUMN;
    } else if (seasonNameUpperCase === "WINTER") {
        return Season.WINTER;
    } else if (seasonNameUpperCase === "SPRING") {
        return Season.SPRING;
    } else if (seasonNameUpperCase === "STORM") {
        return Season.STORM;
    } else {
        return undefined;
    }
}

export function setSeasonFromConfig(container: DependencyContainer): undefined {
    const season = getSeasonByName(config.season)

    if (season != undefined) {
        setSeason(container, season);
    }
}

export function setSeasonRandom(container: DependencyContainer): undefined {
    const season = getRandomSeason(container);
    setSeason(container, season);
}

function setSeason(container: DependencyContainer, season: Season): undefined {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const weatherConfig: IWeatherConfig = configServer.getConfig(ConfigTypes.WEATHER);

    weatherConfig.overrideSeason = season;
}

function getRandomSeason(container: DependencyContainer): Season {
    const randomUtil: RandomUtil = container.resolve<RandomUtil>("RandomUtil");
    const seasons: Season[] = [Season.WINTER, Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.STORM];
    return randomUtil.getArrayValue(seasons);
}
