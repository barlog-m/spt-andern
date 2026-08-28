using System.Collections.Frozen;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Generators.Bot;
using SPTarkov.Server.Core.Generators.Loot;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Helpers.Bot;
using SPTarkov.Server.Core.Helpers.Items;
using SPTarkov.Server.Core.Helpers.Profile;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Bots;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Services.Bot;
using SPTarkov.Server.Core.Services.Locales;
using SPTarkov.Server.Core.Utils;
using SPTarkov.Server.Core.Utils.Cloners;

namespace BarlogM_Andern;

[Injectable(InjectionType.Scoped)]
public class BotLootGeneratorEx(
    ISptLogger<BotLootGenerator> logger,
    RandomUtil randomUtil,
    ItemHelper itemHelper,
    InventoryHelper inventoryHelper,
    HandbookHelper handbookHelper,
    BotGeneratorHelper botGeneratorHelper,
    BotWeaponGenerator botWeaponGenerator,
    WeightedRandomHelper weightedRandomHelper,
    BotHelper botHelper,
    BotLootCacheService botLootCacheService,
    ServerLocalisationService serverLocalisationService,
    BotConfig botConfig,
    PmcConfig pmcConfig,
    ICloner cloner,
    ModData modData
) : BotLootGenerator(
    logger,
    randomUtil,
    itemHelper,
    inventoryHelper,
    handbookHelper,
    botGeneratorHelper,
    botWeaponGenerator,
    weightedRandomHelper,
    botHelper,
    botLootCacheService,
    serverLocalisationService,
    botConfig,
    pmcConfig,
    cloner
)
{
    private static readonly Dictionary<MongoId, double> GP_DICT = new()
        { [Money.GP] = 1 };

    private static readonly Dictionary<MongoId, double> LEGA_DICT = new()
        { [ModData.LEGA_MEDAL_ID] = 1 };

    private static readonly FrozenSet<string> ALL_SCAVS = [
        "arenafighter",
        "arenafighterevent",
        "assault",
        "assaultgroup",
        "bossboar",
        "bossboarsniper",
        "bossbully",
        "bossgluhar",
        "bosskilla",
        "bosskillaagro",
        "bossknight",
        "bosskojaniy",
        "bosskolontay",
        "bosspartisan",
        "bosssanitar",
        "bosstagilla",
        "bosstagillaagro",
        "bosstest",
        "bosszryachiy",
        "crazyassaultevent",
        "cursedassault",
        "exusec",
        "followerbigpipe",
        "followerbirdeye",
        "followerboar",
        "followerboarclose1",
        "followerboarclose2",
        "followerbully",
        "followergluharassault",
        "followergluharscout",
        "followergluharsecurity",
        "followergluharsnipe",
        "followerkojaniy",
        "followerkolontayassault",
        "followerkolontaysecurity",
        "followersanitar",
        "followertagilla",
        "followerzryachiy",
        "infectedassault",
        "infectedcivil",
        "infectedlaborant",
        "infectedpmc",
        "infectedtagilla",
        "marksman",
        "peacemaker",
        "pmc",
        "pmcbot",
        "sectantoni",
        "sectantpredvestnik",
        "sectantpriest",
        "sectantprizrak",
        "sectantwarrior",
        "skier",
        "tagillahelperagro"
    ];

    private readonly ModConfig _modConfig = modData.ModConfig;

    public override void GenerateLoot(
        MongoId botId,
        MongoId sessionId,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory
        )
    {
        base.GenerateLoot(botId, sessionId, botJsonTemplate,
            botGenerationDetails, botInventory);

        if (_modConfig.LegaMedalOnBosses)
        {
            if (botConfig.Bosses.Contains(botGenerationDetails.Role))
            {
                AddLegaMedal(botId, botGenerationDetails, botInventory);
            }
        }

        if (_modConfig.GpCoinsOnPmcAndScavs)
        {
            if (botGenerationDetails.IsPmc ||
                ALL_SCAVS.Contains(botGenerationDetails.Role.ToLower()))
            {
                AddGpCoins(botId, botGenerationDetails, botInventory);
            }
        }
    }

    private void AddLegaMedal(MongoId botId,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory)
    {
        AddLootFromPool(
            botId,
            LEGA_DICT,
            [EquipmentSlots.Pockets],
            1,
            botInventory,
            botGenerationDetails.Role,
            null,
            0,
            botGenerationDetails.IsPmc
        );
    }

    private void AddGpCoins(MongoId botId,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory)
    {
        AddLootFromPool(
            botId,
            GP_DICT,
            [EquipmentSlots.Pockets, EquipmentSlots.Backpack, EquipmentSlots.TacticalVest],
            1,
            botInventory,
            botGenerationDetails.Role,
            null,
            0,
            botGenerationDetails.IsPmc
        );
    }
}
