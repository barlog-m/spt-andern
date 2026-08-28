using System.Collections.Frozen;
using System.Reflection;
using HarmonyLib;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Reflection.Patching;
using SPTarkov.Server.Core.Generators.Loot;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Bots;
using SPTarkov.Server.Core.Models.Spt.Config;

namespace BarlogM_Andern;

[Injectable]
public class BotLootGeneratorPatch : AbstractPatch
{
    private static ISptLogger<BotLootGeneratorPatch> _logger = default!;
    private static BotConfig _botConfig = default!;
    private static ModData _modData = default!;

    private static readonly MethodInfo AddLootFromPoolMethod = AccessTools.Method(
        typeof(BotLootGenerator),
        "AddLootFromPool",
        [
            typeof(MongoId),
            typeof(Dictionary<MongoId, double>),
            typeof(HashSet<EquipmentSlots>),
            typeof(double),
            typeof(BotBaseInventory),
            typeof(string),
            typeof(ItemSpawnLimitSettings),
            typeof(double),
            typeof(bool)
        ]
    ) ?? throw new InvalidOperationException(
        "Could not find target method BotLootGenerator.AddLootFromPool");

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

    public BotLootGeneratorPatch(
        ISptLogger<BotLootGeneratorPatch> logger,
        BotConfig botConfig,
        ModData modData)
    {
        _logger = logger;
        _botConfig = botConfig;
        _modData = modData;
    }

    protected override MethodBase GetTargetMethod()
    {
        return typeof(BotLootGenerator).GetMethod(nameof(BotLootGenerator.GenerateLoot))
               ?? throw new InvalidOperationException(
                   "Could not find target method BotLootGenerator.GenerateLoot");
    }

    [PatchPostfix]
    public static void Postfix(
        BotLootGenerator __instance,
        MongoId botId,
        MongoId sessionId,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory
        )
    {
        var modConfig = _modData.ModConfig;

        if (modConfig.LegaMedalOnBosses)
        {
            if (_botConfig.Bosses.Contains(botGenerationDetails.Role))
            {
                AddLegaMedal(__instance, botId, botGenerationDetails, botInventory);
            }
        }

        if (modConfig.GpCoinsOnPmcAndScavs)
        {
            if (botGenerationDetails.IsPmc ||
                ALL_SCAVS.Contains(botGenerationDetails.Role.ToLower()))
            {
                AddGpCoins(__instance, botId, botGenerationDetails, botInventory);
            }
        }
    }

    private static void AddLegaMedal(
        BotLootGenerator instance,
        MongoId botId,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory)
    {
        AddLootFromPool(
            instance,
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

    private static void AddGpCoins(
        BotLootGenerator instance,
        MongoId botId,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory)
    {
        AddLootFromPool(
            instance,
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

    private static void AddLootFromPool(
        BotLootGenerator instance,
        MongoId botId,
        Dictionary<MongoId, double> pool,
        HashSet<EquipmentSlots> equipmentSlots,
        double totalItemCount,
        BotBaseInventory inventoryToAddItemsTo,
        string botRole,
        ItemSpawnLimitSettings? itemSpawnLimits,
        double totalValueLimitRub,
        bool isPmc)
    {
        try
        {
            AddLootFromPoolMethod.Invoke(instance, [
                botId,
                pool,
                equipmentSlots,
                totalItemCount,
                inventoryToAddItemsTo,
                botRole,
                itemSpawnLimits,
                totalValueLimitRub,
                isPmc
            ]);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            _logger.Error("[Andern] AddLootFromPool", ex.InnerException);
        }
    }
}
