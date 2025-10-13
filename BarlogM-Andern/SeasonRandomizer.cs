using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Logging;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton)]
public class SeasonRandomizer(
    ISptLogger<SeasonRandomizer> logger,
    ConfigServer configServer,
    RandomUtil randomUtil,
    ModData modData
)
{
    private static Season[] Seasons =
    [
        Season.WINTER,
        Season.SPRING_EARLY,
        Season.SPRING,
        Season.SUMMER,
        Season.AUTUMN,
        Season.AUTUMN_LATE,
        Season.STORM
    ];

    private readonly ModConfig _modConfig = modData.ModConfig;

    public void RandimizeSeason()
    {
        if (!_modConfig.RandomizeSeason) return;

        var weatherConfig = configServer.GetConfig<WeatherConfig>();
        weatherConfig.OverrideSeason = GetRandomSeason();

        if (_modConfig.Debug)
        {
            logger.LogWithColor($"[Andern] Next raid season is: {weatherConfig.OverrideSeason.ToString()}", LogTextColor.Blue);
        }
    }

    private Season GetRandomSeason()
    {
        return randomUtil.GetArrayValue(Seasons);
    }
}
