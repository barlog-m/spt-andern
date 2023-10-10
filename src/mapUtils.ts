export function isFactoryOrLab(location: string): boolean {
    if (location === "factory4_day") {
        return true;
    } else if (location === "laboratory") {
        return true;
    } else {
        return false;
    }
}
