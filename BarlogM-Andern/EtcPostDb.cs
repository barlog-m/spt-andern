using System.Collections.Frozen;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton,
    TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class EtcPostDb(
    ISptLogger<EtcPostDb> logger,
    DatabaseService databaseService,
    ConfigServer configServer,
    ItemHelper itemHelper,
    ModData modData
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public Task OnLoad()
    {
        if (_modConfig.FleaBlacklistDisable)
        {
            FleaBlacklistDisable();
        }

        if (_modConfig.RemoveAllTradersItemsFromFlea)
        {
            RemoveAllTradersItemsFromFlea();
        }

        return Task.CompletedTask;
    }

    private void FleaBlacklistDisable()
    {
        var ragfairConfig =
            configServer.GetConfig<RagfairConfig>();
        ragfairConfig.Dynamic.Blacklist.EnableBsgList = false;
        ragfairConfig.Dynamic.Blacklist.TraderItems = true;
    }

    private void RemoveAllTradersItemsFromFlea()
    {
        FrozenSet<MongoId> ignoreBaseClasses = [
            BaseClasses.FOOD,
            BaseClasses.FOOD_DRINK,
            BaseClasses.BARTER_ITEM,
            BaseClasses.KEY,
            BaseClasses.KEYCARD,
        ];

        FrozenSet<MongoId> traders = [
            Traders.PRAPOR,
            Traders.THERAPIST,
            Traders.SKIER,
            Traders.PEACEKEEPER,
            Traders.MECHANIC,
            Traders.RAGMAN,
            Traders.JAEGER,
            Traders.REF,
            Traders.BTR
        ];

        var ragfair = configServer.GetConfig<RagfairConfig>();

        foreach (var traderId in traders)
        {
            var trader = databaseService.GetTrader(traderId);
            foreach (var item in trader.Assort.Items)
            {
                if (!itemHelper.IsOfBaseclasses(item.Template,
                        ignoreBaseClasses))
                {
                    ragfair.Dynamic.Blacklist.Custom.Add(item.Template);
                }
            }
        }

        AddExtraItemsToBlacklist(ragfair);
    }

    void AddExtraItemsToBlacklist(RagfairConfig ragfair)
    {
        FrozenSet<MongoId> items = [
            "628e4e576d783146b124c64d", // Peltor ComTac IV Hybrid headset (Coyote Brown)
            "66b5f693acff495a294927e3", // Peltor ComTac V headset (OD Green)
            "66b5f6985891c84aab75ca76", // Peltor ComTac VI headset (Coyote Brown)
            "5f60cd6cf2bcbb675b00dac6", // Walker's XCEL 500BT Digital headset
            "5c0e874186f7745dc7616606", // Maska-1SCh bulletproof helmet (Killa Edition)
            "6759af0f9c8a538dd70bfae6" // Maska-1SCh bulletproof helmet (Christmas Edition)
        ];

        ragfair.Dynamic.Blacklist.Custom.UnionWith(items);
    }
}
