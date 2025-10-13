using fastJSON5;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Extensions;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Routers;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;
using SPTarkov.Server.Core.Utils;
using SPTarkov.Server.Core.Utils.Cloners;
using Path = System.IO.Path;

namespace BarlogM_Andern;

internal class TraderItems {
    public string[] One { get; set; }
    public string[] Two { get; set; }
    public string[] Three { get; set; }
    public string[] Four { get; set; }
}

[Injectable(InjectionType.Singleton,
    TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class DoeTrader(
    ISptLogger<DoeTrader> logger,
    ModHelper modHelper,
    ImageRouter imageRouter,
    DatabaseService databaseService,
    ConfigServer configServer,
    TimeUtil timeUtil,
    CustomTraderHelper customTraderHelper,
    ItemHelper itemHelper,
    ICloner cloner,
    PresetHelper presetHelper,
    ModData modData
)
    : IOnLoad
{
    private readonly TraderConfig _traderConfig =
        configServer.GetConfig<TraderConfig>();

    private readonly RagfairConfig _ragfairConfig =
        configServer.GetConfig<RagfairConfig>();

    private readonly string _traderDataPath =
        Path.Combine(modData.PathToMod, "trader");

    private string traderId;

    public Task OnLoad()
    {
        if (!modData.ModConfig.Trader)
        {
            return Task.CompletedTask;
        }

        var traderImagePath = Path.Combine(_traderDataPath, "doetrader.jpg");
        var traderBase =
            modHelper.GetJsonDataFromFile<TraderBase>(_traderDataPath,
                "base.json");
        traderId = traderBase.Id;

        imageRouter.AddRoute(traderBase.Avatar!.Replace(".jpg", ""),
            traderImagePath);
        customTraderHelper.SetTraderUpdateTime(_traderConfig, traderBase,
            timeUtil.GetHoursAsSeconds(1), timeUtil.GetHoursAsSeconds(2));

        _ragfairConfig.Traders.TryAdd(traderBase.Id, true);

        AddTraderWithEmptyAssortToDb(traderBase);

        customTraderHelper.AddTraderToLocales(traderBase, "Doe",
            "Andern mod trader");

        var assort = LoadItems();

        customTraderHelper.OverwriteTraderAssort(traderBase.Id, assort);

        if (modData.ModConfig.TraderInsurance)
        {
            EnableEnshurance();
        }

        if (modData.ModConfig.TraderRepair)
        {
            EnableRepair();
        }

        return Task.CompletedTask;
    }

    private void EnableRepair()
    {
        var trader = databaseService.GetTrader(traderId);
        trader.Base.Repair.Availability = true;
    }

    private void EnableEnshurance()
    {
        var trader = databaseService.GetTrader(traderId);
        trader.Base.Insurance.Availability = true;

        var insuranceConfig = configServer.GetConfig<InsuranceConfig>();
        insuranceConfig.ReturnChancePercent[traderId] = 100;
        insuranceConfig.RunIntervalSeconds = 60;
    }

    private TraderAssort LoadItems()
    {
        var traderAssort = new TraderAssort
        {
            Items = [],
            BarterScheme = new Dictionary<MongoId, List<List<BarterScheme>>>(),
            LoyalLevelItems = new Dictionary<MongoId, int>()
        };

        var items = JSON5.ToObject<TraderItems>(modHelper.GetRawFileData(_traderDataPath, "items.json5"));

        AddItems(traderAssort, items.One, 1);
        AddItems(traderAssort, items.Two, 2);
        AddItems(traderAssort, items.Three, 3);
        AddItems(traderAssort, items.Four, 4);

        return traderAssort;
    }

    private void AddItems(TraderAssort traderAssort, string[] itemsData, int level)
    {
        foreach (var itemData in itemsData)
        {
            var tpl = new MongoId(itemData);

            if (itemHelper.IsOfBaseclass(tpl, BaseClasses.AMMO))
            {
                AddItem(traderAssort, tpl, level, 1500, 500);
            }
            else if (itemHelper.IsOfBaseclass(tpl, BaseClasses.KEY))
            {
                AddItem(traderAssort, tpl, level, 1, 1);
            }
            else if (itemHelper.IsOfBaseclass(tpl, BaseClasses.ARMOR))
            {
                AddArmorItem(traderAssort, tpl, level, 3, 3);
            }
            else if (itemHelper.IsOfBaseclass(tpl, BaseClasses.VEST))
            {
                AddArmorItem(traderAssort, tpl, level, 3, 3);
            }
            else
            {
                AddItem(traderAssort, tpl, level, 3, 3);
            }
        }
    }

    private void AddArmorItem(TraderAssort assort, MongoId tpl, int level, int count, int buyRestrictionMax)
    {
        var preset = presetHelper.GetDefaultPresetsByTplKey()[tpl];

        var tpls = preset.Items.Select(item => item.Template);
        var price = itemHelper.GetItemAndChildrenPrice(tpls);

        var presetAndModsClone = cloner.Clone(preset.Items).ReplaceIDs().ToList();
        presetAndModsClone.RemapRootItemId();

        presetAndModsClone.First().ParentId = "hideout";
        presetAndModsClone.First().SlotId = "hideout";
        presetAndModsClone.First().Upd = new Upd
        {
            UnlimitedCount = false,
            StackObjectsCount = count,
            BuyRestrictionMax = buyRestrictionMax,
            BuyRestrictionCurrent = 0
        };

        assort.Items.AddRange(presetAndModsClone);

        assort.BarterScheme.Add(presetAndModsClone.First().Id, [[new BarterScheme
        {
            Template = Money.ROUBLES,
            Count = price,
        }]]);

        assort.LoyalLevelItems.Add(presetAndModsClone.First().Id, level);
    }

    private void AddItem(TraderAssort assort, MongoId tpl, int level, int count, int buyRestrictionMax)
    {
        var price = itemHelper.GetItemPrice(tpl);

        var item = new Item
        {
            Id = new MongoId(),
            Template = tpl,
            ParentId = "hideout",
            SlotId = "hideout",
            Upd = new Upd
            {
                UnlimitedCount = false,
                StackObjectsCount = count,
                BuyRestrictionMax = buyRestrictionMax,
                BuyRestrictionCurrent = 0
            }
        };

        assort.Items.Add(item);

        assort.BarterScheme.Add(item.Id, [[new BarterScheme
        {
            Template = Money.ROUBLES,
            Count = price,
        }]]);

        assort.LoyalLevelItems.Add(item.Id, level);
    }


    private void AddTraderWithEmptyAssortToDb(TraderBase traderDetailsToAdd)
    {
        var emptyTraderItemAssortObject = new TraderAssort
        {
            Items = [],
            BarterScheme = new Dictionary<MongoId, List<List<BarterScheme>>>(),
            LoyalLevelItems = new Dictionary<MongoId, int>()
        };

        var therapist = databaseService.GetTrader(Traders.THERAPIST);

        var traderDataToAdd = new Trader
        {
            Assort = emptyTraderItemAssortObject,
            Base = cloner.Clone(traderDetailsToAdd),
            QuestAssort =
                new()
                {
                    { "Started", new() },
                    { "Success", new() },
                    { "Fail", new() }
                },
            Dialogue = cloner.Clone(therapist.Dialogue)
        };

        if (!databaseService.GetTables().Traders
                .TryAdd(traderDetailsToAdd.Id, traderDataToAdd))
        {
            logger.Error("Error add Doe trader");
        }
    }
}
