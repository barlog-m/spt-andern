using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Config;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton, TypePriority = OnLoadOrder.Preload + 1)]
public class EtcPreSpt(
    ISptLogger<EtcPreSpt> logger,
    SeasonalEventConfig seasonalEventConfig,
    BotConfig botConfig,
    ModData modData
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;


    public Task OnLoadAsync(CancellationToken cancellationToken)
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
        seasonalEventConfig.EnableSeasonalEventDetection = false;
    }

    private void WeeklyBossEventDisable()
    {
        botConfig.WeeklyBoss.Enabled = false;
    }
}