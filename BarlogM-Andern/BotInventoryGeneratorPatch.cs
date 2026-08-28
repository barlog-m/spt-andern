using System.Reflection;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Reflection.Patching;
using SPTarkov.Server.Core.Generators.Bot;
using SPTarkov.Server.Core.Generators.Loot;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Bots;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Services.Bot;
using SPTarkov.Server.Core.Services.Profile;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable]
public class BotInventoryGeneratorPatch : AbstractPatch
{
    private static ISptLogger<BotInventoryGeneratorPatch> _logger = default!;
    private static RandomUtil _randomUtil = default!;
    private static ProfileActivityService _profileActivityService = default!;
    private static BotWeaponGenerator _botWeaponGenerator = default!;
    private static BotLootGenerator _botLootGenerator = default!;
    private static BotInventoryContainerService _botInventoryContainerService = default!;
    private static PmcConfig _pmcConfig = default!;
    private static Data _data = default!;
    private static GearGeneratorHelper _gearGeneratorHelper = default!;
    private static HelmetGenerator _helmetGenerator = default!;
    private static WeaponGenerator _weaponGenerator = default!;

    public BotInventoryGeneratorPatch(
        ISptLogger<BotInventoryGeneratorPatch> logger,
        RandomUtil randomUtil,
        ProfileActivityService profileActivityService,
        BotWeaponGenerator botWeaponGenerator,
        BotLootGenerator botLootGenerator,
        BotInventoryContainerService botInventoryContainerService,
        PmcConfig pmcConfig,
        Data data,
        GearGeneratorHelper gearGeneratorHelper,
        HelmetGenerator helmetGenerator,
        WeaponGenerator weaponGenerator)
    {
        _logger = logger;
        _randomUtil = randomUtil;
        _profileActivityService = profileActivityService;
        _botWeaponGenerator = botWeaponGenerator;
        _botLootGenerator = botLootGenerator;
        _botInventoryContainerService = botInventoryContainerService;
        _pmcConfig = pmcConfig;
        _data = data;
        _gearGeneratorHelper = gearGeneratorHelper;
        _helmetGenerator = helmetGenerator;
        _weaponGenerator = weaponGenerator;
    }

    protected override MethodBase GetTargetMethod()
    {
        return typeof(BotInventoryGenerator).GetMethod(nameof(BotInventoryGenerator.GenerateInventory))
               ?? throw new InvalidOperationException(
                   "Could not find target method BotInventoryGenerator.GenerateInventory");
    }

    [PatchPrefix]
    public static bool Prefix(
        BotInventoryGenerator __instance,
        ref BotBaseInventory __result,
        MongoId botId,
        MongoId sessionId,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails
        )
    {
        if (!botGenerationDetails.IsPmc)
        {
            return true;
        }

        var botInventory = __instance.GenerateInventoryBase();

        var presetTierConfig = _data.GetConfig(botGenerationDetails.BotLevel);

        var isKittedHelmet = _randomUtil.GetChance100(
            presetTierConfig.KittedHelmetPercent);

        var raidConfig = _profileActivityService
            .GetProfileActivityRaidData(sessionId).RaidConfiguration;

        var isNightVision = raidConfig!.IsNightRaid && raidConfig.Location! is not ("laboratory" or "labyrinth") && _randomUtil.GetChance100(presetTierConfig.NightVisionPercent);

        try
        {
            GenerateAndAddEquipmentToBotEx(
                botId,
                botInventory,
                botGenerationDetails,
                isNightVision,
                isKittedHelmet
            );
        }
        catch (Exception ex)
        {
            _logger.Error("[Andern] Equipment generate", ex);
        }

        try
        {
            GenerateAndAddWeaponsToBotEx(
                botId,
                botInventory,
                botJsonTemplate,
                botGenerationDetails,
                isNightVision
            );
        }
        catch (Exception ex)
        {
            _logger.Error("[Andern] Weapon generate", ex);
        }

        _botLootGenerator.GenerateLoot(botId, sessionId, botJsonTemplate,
            botGenerationDetails, botInventory);

        if (botGenerationDetails.ClearBotContainerCacheAfterGeneration)
        {
            _botInventoryContainerService.ClearCache(botId);
        }

        __result = botInventory;

        return false;
    }

    static void GenerateAndAddEquipmentToBotEx(
        MongoId botId,
        BotBaseInventory botInventory,
        BotGenerationDetails botGenerationDetails,
        bool isNightVision,
        bool isKittedHelmet
    )
    {
        var armbandTpl =
            botGenerationDetails.RoleLowercase == "pmcusec"
                ? _pmcConfig.ForceArmband.Usec
                : _pmcConfig.ForceArmband.Bear;
        _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.ArmBand,
            botGenerationDetails.Role,
            botInventory,
            armbandTpl);

        var generatedPockets = _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Pockets,
            botGenerationDetails.Role,
            botInventory,
            botGenerationDetails is
                { GameVersion: GameEditions.UNHEARD, IsPmc: true }
                ? ItemTpl.POCKETS_1X4_TUE
                : ItemTpl.POCKETS_1X4);

        _botInventoryContainerService.AddEmptyContainerToBot(botId,
            EquipmentSlots.Pockets, generatedPockets);

        var secureContainerItem = _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.SecuredContainer,
            botGenerationDetails.Role,
            botInventory,
            ItemTpl.SECURE_CONTAINER_BOSS);

        _botInventoryContainerService.AddEmptyContainerToBot(botId,
            EquipmentSlots.SecuredContainer, secureContainerItem);

        if (_randomUtil.GetChance100(30) && !isNightVision && GetMaskItemTpl(botGenerationDetails.BotLevel) != "")
        {
            GenerateMaskAndEarpieceItem(
                botGenerationDetails.BotLevel,
                botGenerationDetails.Role,
                botInventory);
        }
        else
        {
            GenerateHeadwearAndEarpieceItem(
                botGenerationDetails.BotLevel,
                botGenerationDetails.Role,
                botInventory,
                isNightVision,
                isKittedHelmet);
        }

        GenerateArmor(
            botId,
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory);

        GenerateGearItem(
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory,
            EquipmentSlots.Eyewear);

        GenerateGearItem(
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory,
            EquipmentSlots.FaceCover);

        var generatedBackPack = GenerateGearItem(
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory,
            EquipmentSlots.Backpack);

        _botInventoryContainerService.AddEmptyContainerToBot(botId,
            EquipmentSlots.Backpack, generatedBackPack);

        GenerateGearItem(
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory,
            EquipmentSlots.Scabbard);
    }

    static void GenerateAndAddWeaponsToBotEx(
        MongoId botId,
        BotBaseInventory botInventory,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails,
        bool isNightVision
    )
    {
        var botLevel = botGenerationDetails.BotLevel;
        var botRole = botGenerationDetails.Role;

        var generatedWeapon = _weaponGenerator.GenerateWeapon(
            botLevel,
            botInventory.Equipment,
            isNightVision);

        botInventory.Items.AddRange(generatedWeapon.WeaponWithMods);

        var generatedWeaponResult = new GenerateWeaponResult
        {
            Weapon = generatedWeapon.WeaponWithMods,
            ChosenAmmoTemplate = generatedWeapon.AmmoTpl,
            ChosenUbglAmmoTemplate = null,
            WeaponMods = botJsonTemplate.BotInventory.Mods,
            WeaponTemplate = generatedWeapon.WeaponTemplate,
        };

        _botWeaponGenerator.AddExtraMagazinesToInventory(
            botId,
            generatedWeaponResult,
            botJsonTemplate.BotGeneration.Items.Magazines,
            botInventory,
            botRole);
    }

    static string GetGearItemTpl(
        int botLevel,
        EquipmentSlots equipmentSlot)
    {
        switch (equipmentSlot)
        {
            case EquipmentSlots.Earpiece:
                return _gearGeneratorHelper.WeightedRandomGearItemTpl(
                    _data.GetGear(botLevel).Headsets);

            case EquipmentSlots.Headwear:
                return _gearGeneratorHelper.WeightedRandomGearItemTpl(
                    _data.GetGear(botLevel).Helmets);

            case EquipmentSlots.Backpack:
                return _gearGeneratorHelper.WeightedRandomGearItemTpl(
                    _data.GetGear(botLevel).Backpacks);

            case EquipmentSlots.FaceCover:
                return _gearGeneratorHelper.WeightedRandomGearItemTpl(
                    _data.GetGear(botLevel).Face);

            case EquipmentSlots.Eyewear:
                return _gearGeneratorHelper.WeightedRandomGearItemTpl(
                    _data.GetGear(botLevel).Eyewear);

            case EquipmentSlots.Scabbard:
                return _gearGeneratorHelper.WeightedRandomGearItemTpl(
                    _data.GetGear(botLevel).Sheath);

            default:
                return "";
        }
    }

    static string GetMaskItemTpl(int botLevel)
    {
        return _gearGeneratorHelper.WeightedRandomGearItemTpl(
            _data.GetGear(botLevel).Mask);
    }

    static void GenerateArmor(
        MongoId botId,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        if (_randomUtil.GetBool())
        {
            var generatedArmoredRig =
                GenerateArmoredRig(botLevel, botRole, botInventory);
            _botInventoryContainerService.AddEmptyContainerToBot(botId,
                EquipmentSlots.TacticalVest, generatedArmoredRig);
        }
        else
        {
            GenerateArmorVest(botLevel, botRole, botInventory);
            var generatedTacticalVest =
                GenerateTacticalVest(botLevel, botRole, botInventory);
            _botInventoryContainerService.AddEmptyContainerToBot(botId,
                EquipmentSlots.TacticalVest, generatedTacticalVest);
        }
    }

    static Item GenerateArmoredRig(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        var armoredRigTpl = _gearGeneratorHelper.WeightedRandomGearItemTpl(
            _data.GetGear(botLevel).ArmoredRigs);

        return _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.TacticalVest,
            botRole,
            botInventory,
            armoredRigTpl);
    }

    static void GenerateArmorVest(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        var armoredRigTpl = _gearGeneratorHelper.WeightedRandomGearItemTpl(
            _data.GetGear(botLevel).Armor);

        _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.ArmorVest,
            botRole,
            botInventory,
            armoredRigTpl);
    }

    static Item GenerateTacticalVest(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        var armoredRigTpl = _gearGeneratorHelper.WeightedRandomGearItemTpl(
            _data.GetGear(botLevel).Rigs);

        return _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.TacticalVest,
            botRole,
            botInventory,
            armoredRigTpl);
    }

    static Item GenerateGearItem(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        EquipmentSlots equipmentSlot)
    {
        var gearItemTpl = GetGearItemTpl(botLevel, equipmentSlot);

        return _gearGeneratorHelper.PutGearItemToInventory(
            equipmentSlot,
            botRole,
            botInventory,
            gearItemTpl);
    }

    static void GenerateMaskAndEarpieceItem(int botLevel, string botRole,
        BotBaseInventory botInventory)
    {
        var maskItemTpl = GetMaskItemTpl(botLevel);

        _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.FaceCover,
            botRole,
            botInventory,
            maskItemTpl);

        var earpieceTpl = GetGearItemTpl(
            botLevel,
            EquipmentSlots.Earpiece);

        _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Earpiece,
            botRole,
            botInventory,
            earpieceTpl);
    }

    static void GenerateHeadwearAndEarpieceItem(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var headwearItemTpl = GetGearItemTpl(
            botLevel,
            EquipmentSlots.Headwear);

        _helmetGenerator.GenerateHelmet(
            botLevel,
            botRole,
            botInventory,
            headwearItemTpl,
            isNightVision,
            isKittedHelmet);

        // for "SSh-68 steel helmet" only one earpiece "GSSh-01 active headset"
        if (headwearItemTpl == "5c06c6a80db834001b735491")
        {
            _gearGeneratorHelper.PutGearItemToInventory(
                EquipmentSlots.Earpiece,
                botRole,
                botInventory,
                "5b432b965acfc47a8774094e");
            return;
        }

        if (_helmetGenerator.IsEarpieceIncompatible(headwearItemTpl))
        {
            return;
        }

        var earpieceTpl = GetGearItemTpl(
            botLevel,
            EquipmentSlots.Earpiece);

        earpieceTpl = _helmetGenerator.IsEarpieceNotFullyCompatible(
            headwearItemTpl)
            ? _gearGeneratorHelper.ReplaceEarpiece(earpieceTpl)
            : earpieceTpl;

        _gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Earpiece,
            botRole,
            botInventory,
            earpieceTpl);
    }
}
