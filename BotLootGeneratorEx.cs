using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Generators;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Bots;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;
using SPTarkov.Server.Core.Utils;
using SPTarkov.Server.Core.Utils.Cloners;

namespace BarlogM_Andern;

[Injectable(InjectionType.Scoped, typeof(BotLootGenerator))]
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
    ConfigServer configServer,
    ICloner cloner,
    JsonUtil jsonUtil,
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
    configServer,
    cloner
)
{
    private static readonly Dictionary<MongoId, double> GpDict = new()
        { [Money.GP] = 1 };

    private static readonly Dictionary<MongoId, double> LegaDict = new()
        { [ModData.LegaMedalId] = 1 };

    private readonly ModConfig _modConfig = modData.ModConfig;

    public override void GenerateLoot(MongoId botId, MongoId sessionId,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory)
    {
        base.GenerateLoot(botId, sessionId, botJsonTemplate,
            botGenerationDetails, botInventory);

        if (_modConfig.GpCoinsOnPmcAndScavs)
        {
            if (botGenerationDetails.IsPmc ||
                string.Equals(botGenerationDetails.Role, "assault", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(botGenerationDetails.Role, "arenafighter", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(botGenerationDetails.Role, "arenafighterevent", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(botGenerationDetails.Role, "exusec", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(botGenerationDetails.Role, "pmc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(botGenerationDetails.Role, "pmcbot", StringComparison.OrdinalIgnoreCase))
            {
                AddGpCoins(botId, botGenerationDetails, botInventory);
            }
        }

        if (_modConfig.LegaMedalOnBosses)
        {
            if (BotConfig.Bosses.Contains(botGenerationDetails.Role))
            {
                AddLegaMedal(botId, botGenerationDetails, botInventory);
            }
        }
    }

    private void AddLegaMedal(MongoId botId,
        BotGenerationDetails botGenerationDetails,
        BotBaseInventory botInventory)
    {
        AddLootFromPool(
            botId,
            LegaDict,
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
            GpDict,
            [EquipmentSlots.Pockets, EquipmentSlots.Backpack],
            1,
            botInventory,
            botGenerationDetails.Role,
            null,
            0,
            botGenerationDetails.IsPmc
        );
    }
}
