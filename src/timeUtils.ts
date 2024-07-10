import { WeatherGenerator } from "@spt/generators/WeatherGenerator";
import { IWeatherData } from "@spt/models/eft/weather/IWeatherData";

export function getCurrentTime(weatherGenerator: WeatherGenerator): string {
    let result: IWeatherData = {
        winterEventEnabled: false,
        acceleration: 0,
        time: "",
        date: "",
        weather: null
    };
    result = weatherGenerator.calculateGameTime(result);
    return result.time;
}

export function getCurrentHour(
    currentTime: string,
    timeVariant: string
): number {
    const [hourStr, minStr, secStr] = currentTime.split(":");
    const hour = parseInt(hourStr);

    if (timeVariant === "PAST") {
        return Math.abs(hour - 12);
    }
    return hour;
}

export function isNight(
    currentTime: string,
    timeVariant: string,
    location: string
): boolean {
    if (location === "factory4_night") {
        return true;
    } else if (location === "factory4_day") {
        return false;
    } else if (location === "laboratory") {
        return false;
    } else {
        const currentHour = getCurrentHour(currentTime, timeVariant);

        if (currentHour >= 22 || currentHour <= 5) return true;

        return false;
    }
}
