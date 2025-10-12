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
    }
}
