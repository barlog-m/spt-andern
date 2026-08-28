using System.Collections.Frozen;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Items;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton,
    TypePriority = OnLoadOrder.PostLoad + 1)]
public class EtcPostDb(
    ISptLogger<EtcPostDb> logger,
    TradersTable tradersTable,
    TemplateTable templateTable,
    RagfairConfig ragfairConfig,
    ScavCaseConfig scavCaseConfig,
    ItemHelper itemHelper,
    ModData modData
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public Task OnLoadAsync(CancellationToken cancellationToken)
    {
        if (_modConfig.FleaBlacklistDisable)
        {
            FleaBlacklistDisable();
        }

        if (_modConfig.RemoveAllTradersItemsFromFlea)
        {
            RemoveAllTradersItemsFromFlea();
        }

        if (_modConfig.ScavCaseLootValueMultiplier != 0)
        {
            ScavCaseLootValueMultiplier();
        }

        FixCirculateQuest();
        FixVssValOveheat();

        if (_modConfig.ReducePenaltiesFromLargeMagazines)
        {
            ReducePenaltiesFromLargeMagazines();
        }

        return Task.CompletedTask;
    }

    void ScavCaseLootValueMultiplier()
    {
        scavCaseConfig.AllowBossItemsAsRewards = true;

        foreach (var valueRange in scavCaseConfig.RewardItemValueRangeRub.Keys)
        {
            scavCaseConfig.RewardItemValueRangeRub[valueRange].Min *=
                _modConfig.ScavCaseLootValueMultiplier;
            scavCaseConfig.RewardItemValueRangeRub[valueRange].Max *=
                _modConfig.ScavCaseLootValueMultiplier;
        }
    }

    void FleaBlacklistDisable()
    {
        ragfairConfig.Dynamic.Blacklist.EnableBsgList = false;
        ragfairConfig.Dynamic.Blacklist.TraderItems = true;
    }

    void RemoveAllTradersItemsFromFlea()
    {
        FrozenSet<MongoId> ignoreBaseClasses =
        [
            BaseClasses.FOOD,
            BaseClasses.FOOD_DRINK,
            BaseClasses.BARTER_ITEM,
            BaseClasses.KEY,
            BaseClasses.KEYCARD,
        ];

        FrozenSet<MongoId> traders =
        [
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

        foreach (var traderId in traders)
        {
            var trader = tradersTable.GetTrader(traderId)!;
            foreach (var item in trader.Assort.Items)
            {
                if (!itemHelper.IsOfBaseclasses(item.Template,
                        ignoreBaseClasses))
                {
                    ragfairConfig.Dynamic.Blacklist.Custom.Add(item.Template);
                }
            }
        }

        AddExtraItemsToBlacklist(ragfairConfig);
    }

    void AddExtraItemsToBlacklist(RagfairConfig ragfair)
    {
        FrozenSet<MongoId> items =
        [
            "628e4e576d783146b124c64d", // Peltor ComTac IV Hybrid headset (Coyote Brown)
            "66b5f693acff495a294927e3", // Peltor ComTac V headset (OD Green)
            "66b5f6985891c84aab75ca76", // Peltor ComTac VI headset (Coyote Brown)
            "5f60cd6cf2bcbb675b00dac6", // Walker's XCEL 500BT Digital headset
            "5c0e874186f7745dc7616606", // Maska-1SCh bulletproof helmet (Killa Edition)
            "6759af0f9c8a538dd70bfae6", // Maska-1SCh bulletproof helmet (Christmas Edition)
            "66b5f65ca7f72d197e70bcd6", // Ballistic Armor Co. Bastion helmet (Armor Black)
            "66b5f661af44ca0014063c05", // Ballistic Armor Co. Bastion helmet (OD Green)
            "66b5f666cad6f002ab7214c2" //Ballistic Armor Co. Bastion helmet (MultiCam)
        ];

        ragfair.Dynamic.Blacklist.Custom.UnionWith(items);
    }

    void FixCirculateQuest()
    {
        var conditionsAvailableForFinish = templateTable
            .Quests["6663149f1d3ec95634095e75"]
            .Conditions.AvailableForFinish;

        if (conditionsAvailableForFinish == null) return;

        var condition = conditionsAvailableForFinish
            .FirstOrDefault(c => c.ConditionType == "SellItemToTrader");

        if (condition != null)
        {
            condition.Target!.List!.Add("67458730df3c1da90b0b052b");
        }
    }

    void FixVssValOveheat()
    {
        const string VSS_TPL = "57838ad32459774a17445cd2";
        const string VAL_TPL = "57c44b372459772d2b39b8ce";
        const double OVERHEAT_MULTIPLIER = 0.8;

        var items = templateTable.Items;

        items[VSS_TPL].Properties!.HeatFactorByShot *= OVERHEAT_MULTIPLIER;
        items[VSS_TPL].Properties!.HeatFactorByShot *= OVERHEAT_MULTIPLIER;
        items[VAL_TPL].Properties!.HeatFactorGun *= OVERHEAT_MULTIPLIER;
        items[VAL_TPL].Properties!.HeatFactorByShot *= OVERHEAT_MULTIPLIER;

        foreach (var (_, itemTemplate) in items.Where(kvp => kvp.Value.Properties!.Caliber == "Caliber9x39"))
        {
            itemTemplate.Properties!.HeatFactor *= OVERHEAT_MULTIPLIER;
        }
    }

    void ReducePenaltiesFromLargeMagazines()
    {
        var items = templateTable.Items;
        foreach (var item in items.Values)
        {
            if (item.Parent != BaseClasses.MAGAZINE) continue;

            if (item.Properties!.LoadUnloadModifier > 20)
            {
                item.Properties!.LoadUnloadModifier /= 2;
            }

            if (item.Properties!.CheckTimeModifier > 10)
            {
                item.Properties!.CheckTimeModifier /= 2;
            }

            if (item.Properties!.Ergonomics < -10)
            {
                item.Properties!.Ergonomics /= 2;
            }
        }
    }
}