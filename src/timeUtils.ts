import { DependencyContainer } from "tsyringe";
import { WeatherGenerator } from "@spt-aki/generators/WeatherGenerator";
import { IWeatherData } from "@spt-aki/models/eft/weather/IWeatherData";

function getCurrentTime(weatherGenerator: WeatherGenerator): string {
    let result: IWeatherData = {
        acceleration: 0,
        time: "",
        date: "",
        weather: null,
    };
    result = weatherGenerator.calculateGameTime(result);
    return result.time;
}

function getCurrentHour(
    container: DependencyContainer,
    timeVariant: string
): number {
    const weatherGenerator =
        container.resolve<WeatherGenerator>("WeatherGenerator");

    const currentTime = getCurrentTime(weatherGenerator);
    const [hourStr, minStr, secStr] = currentTime.split(":");
    const hour = parseInt(hourStr);

    if (timeVariant === "PAST") {
        return hour - 12;
    }
    return hour;
}

export function isNight(
    container: DependencyContainer,
    timeVariant: string,
    location: string
): boolean {
    if (location === "factory4_night") {
        return true;
    } else {
        const currentHour = getCurrentHour(container, timeVariant);

        if (currentHour >= 22 || currentHour <= 5) return true;

        return false;
    }
}
