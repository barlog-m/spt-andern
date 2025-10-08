using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Services;
using SPTarkov.Server.Core.Utils.Cloners;

namespace BarlogM_Andern;

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class CustomTraderHelper(
    ISptLogger<Andern> logger,
    ICloner cloner,
    DatabaseService databaseService,
    LocaleService localeService)
{
    /// <summary>
    /// Add the traders update time for when their offers refresh
    /// </summary>
    /// <param name="traderConfig">trader config to add our trader to</param>
    /// <param name="baseJson">json file for trader (db/base.json)</param>
    /// <param name="refreshTimeSecondsMin">How many seconds between trader stock refresh min time</param>
    /// <param name="refreshTimeSecondsMax">How many seconds between trader stock refresh max time</param>
    public void SetTraderUpdateTime(TraderConfig traderConfig,
        TraderBase baseJson, int refreshTimeSecondsMin,
        int refreshTimeSecondsMax)
    {
        // Add refresh time in seconds to config
        var traderRefreshRecord = new UpdateTime
        {
            TraderId = baseJson.Id,
            Seconds = new MinMax<int>(refreshTimeSecondsMin,
                refreshTimeSecondsMax)
        };

        traderConfig.UpdateTime.Add(traderRefreshRecord);
    }

    /// <summary>
    /// Add a traders base data to the server, no assort items
    /// </summary>
    /// <param name="traderDetailsToAdd">trader details</param>

    public void AddTraderToLocales(TraderBase baseJson, string firstName, string description)
    {
        var locales = databaseService.GetTables().Locales.Global;
        var newTraderId = baseJson.Id;

        foreach (var (localeKey, localeKvP) in locales)
        {
            localeKvP.AddTransformer(lazyloadedLocaleData =>
            {
                lazyloadedLocaleData.Add($"{newTraderId} FullName", baseJson.Name);
                lazyloadedLocaleData.Add($"{newTraderId} FirstName", firstName);
                lazyloadedLocaleData.Add($"{newTraderId} Nickname", baseJson.Nickname!);
                lazyloadedLocaleData.Add($"{newTraderId} Location", baseJson.Location!);
                lazyloadedLocaleData.Add($"{newTraderId} Description",
                    description);
                return lazyloadedLocaleData;
            });
        }
    }

    /// <summary>
    /// Overwrite the desired traders assorts with the ones provided
    /// </summary>
    /// <param name="traderId">Trader to override assorts of</param>
    /// <param name="newAssorts">new assorts we want to add</param>
    public void OverwriteTraderAssort(string traderId, TraderAssort newAssorts)
    {
        if (!databaseService.GetTables().Traders
                .TryGetValue(traderId, out var traderToEdit))
        {
            logger.Warning(
                $"Unable to update assorts for trader: {traderId}, they couldn't be found on the server");

            return;
        }

        // Override the traders assorts with the ones we passed in
        traderToEdit.Assort = newAssorts;
    }
}
