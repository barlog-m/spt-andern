using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton)]
public class SeasonRandomizer(
    ISptLogger<SeasonRandomizer> logger,
    WeatherConfig weatherConfig,
    RandomUtil randomUtil,
    ModData modData
)
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public void RandimizeSeason()
    {
        weatherConfig.OverrideSeason = randomUtil.GetArrayValue(_modConfig.RandomizeSeason);

        if (_modConfig.Debug)
        {
            logger.LogWithColor($"[Andern] Next raid season is: {weatherConfig.OverrideSeason.ToString()}", Spectre.Console.Color.Blue);
        }
    }
}
