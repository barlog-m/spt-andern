using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Services.Locales;
using SPTarkov.Server.Core.Utils.Cloners;

namespace BarlogM_Andern;

[Injectable(TypePriority = OnLoadOrder.TraderRegistration + 1)]
public class CustomTraderHelper(
    ISptLogger<CustomTraderHelper> logger,
    ICloner cloner,
    TradersTable tradersTable,
    LocaleTable localeTable,
    LocaleService localeService)
{
    /// <summary>
    /// Add the traders update time for when their offers refresh
    /// </summary>
    /// <param name="traderConfig">trader config to add our trader to</param>
    /// <param name="baseJson">json file for trader (db/base.json)</param>
    /// <param name="refreshTimeSecondsMin">How many seconds between trader stock refresh min time</param>
    /// <param name="refreshTimeSecondsMax">How many seconds between trader stock refresh max time</param>
    public void SetTraderUpdateTime(TraderConfig traderConfig, TraderBase baseJson, int refreshTimeSecondsMin,
        int refreshTimeSecondsMax)
    {
        // Add refresh time in seconds to config
        var traderRefreshRecord = new UpdateTime
        {
            TraderId = baseJson.Id,
            Seconds = new MinMax<int>(refreshTimeSecondsMin, refreshTimeSecondsMax)
        };

        traderConfig.UpdateTime.Add(traderRefreshRecord);
    }

    /// <summary>
    /// Add traders name/location/description to all locales (e.g. German/French/English)
    /// </summary>
    /// <param name="baseJson">json file for trader (db/base.json)</param>
    /// <param name="firstName">First name of trader</param>
    /// <param name="description">Flavor text of whom the trader is</param>
    public void AddTraderToLocales(TraderBase baseJson, string firstName, string description)
    {
        // For each language, add locale for the new trader
        var locales = localeTable.Global;
        var newTraderId = baseJson.Id;
        var fullName = baseJson.Name;
        var nickName = baseJson.Nickname;
        var location = baseJson.Location;

        foreach (var (localeKey, localeKvP) in locales)
        {
            // We have to add a transformer here, because locales are lazy loaded due to them taking up huge space in memory
            // The transformer will make sure that each time the locales are requested, the ones added below are included
            localeKvP.AddTransformer(lazyloadedLocaleData =>
            {
                lazyloadedLocaleData.Add($"{newTraderId} FullName", fullName);
                lazyloadedLocaleData.Add($"{newTraderId} FirstName", firstName);
                lazyloadedLocaleData.Add($"{newTraderId} Nickname", nickName);
                lazyloadedLocaleData.Add($"{newTraderId} Location", location);
                lazyloadedLocaleData.Add($"{newTraderId} Description", description);
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
        if (!tradersTable.TryGetValue(traderId, out var traderToEdit))
        {
            logger.Warning($"Unable to update assorts for trader: {traderId}, they couldn't be found on the server");

            return;
        }

        // Override the traders assorts with the ones we passed in
        traderToEdit.Assort = newAssorts;
    }
}