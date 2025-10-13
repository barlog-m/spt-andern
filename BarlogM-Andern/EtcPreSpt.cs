using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton, TypePriority = OnLoadOrder.PreSptModLoader + 1)]
public class EtcPreSpt(
    ISptLogger<EtcPreSpt> logger,
    ConfigServer configServer,
    ModData modData
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public Task OnLoad()
    {
        if (_modConfig.SeasonalEventsDisable)
        {
            SeasonalEventsDisable();
        }

        if (_modConfig.WeeklyBossEventDisable)
        {
            WeeklyBossEventDisable();
        }

        return Task.CompletedTask;
    }

    private void SeasonalEventsDisable()
    {
        var seasonalEventConfig = configServer.GetConfig<SeasonalEventConfig>();
        seasonalEventConfig.EnableSeasonalEventDetection = false;
    }

    private void WeeklyBossEventDisable()
    {
        var botConfig = configServer.GetConfig<BotConfig>();
        botConfig.WeeklyBoss.Enabled = false;
    }
}
