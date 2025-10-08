using System.Collections.Frozen;
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

namespace BarlogM_Andern;

[Injectable(InjectionType.Scoped, typeof(BotInventoryGenerator))]
public class BotInventoryGeneratorEx(
    ISptLogger<BotInventoryGenerator> logger,
    RandomUtil randomUtil,
    ProfileActivityService profileActivityService,
    BotWeaponGenerator botWeaponGenerator,
    BotLootGenerator botLootGenerator,
    BotGeneratorHelper botGeneratorHelper,
    ProfileHelper profileHelper,
    BotHelper botHelper,
    WeightedRandomHelper weightedRandomHelper,
    ItemHelper itemHelper,
    WeatherHelper weatherHelper,
    ServerLocalisationService serverLocalisationService,
    BotEquipmentFilterService botEquipmentFilterService,
    BotEquipmentModPoolService botEquipmentModPoolService,
    BotEquipmentModGenerator botEquipmentModGenerator,
    BotInventoryContainerService botInventoryContainerService,
    ConfigServer configServer,
    Data data,
    GearGeneratorHelper gearGeneratorHelper,
    HelmetGenerator helmetGenerator,
    WeaponGenerator weaponGenerator
) : BotInventoryGenerator(
    logger,
    randomUtil,
    profileActivityService,
    botWeaponGenerator,
    botLootGenerator,
    botGeneratorHelper,
    profileHelper,
    botHelper,
    weightedRandomHelper,
    itemHelper,
    weatherHelper,
    serverLocalisationService,
    botEquipmentFilterService,
    botEquipmentModPoolService,
    botEquipmentModGenerator,
    botInventoryContainerService,
    configServer)
{
    public override BotBaseInventory GenerateInventory(
        MongoId botId,
        MongoId sessionId,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails)
    {
        if (!botGenerationDetails.IsPmc)
        {
            return base.GenerateInventory(botId, sessionId, botJsonTemplate,
                botGenerationDetails);
        }

        var botInventory = GenerateInventoryBase();

        var presetTierConfig = data.GetConfig(botGenerationDetails.BotLevel);

        var isKittedHelmet = randomUtil.GetChance100(
            presetTierConfig.KittedHelmetPercent);

        var raidConfig = profileActivityService
            .GetProfileActivityRaidData(sessionId)?.RaidConfiguration;

        var isNightVision = raidConfig.IsNightRaid
            ? randomUtil.GetChance100(presetTierConfig.NightVisionPercent)
            : false;

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
            logger.Error("[Andern] Equipmnet generate", ex);
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
            logger.Error("[Andern] Weapon generate", ex);
        }

        // Pick loot and add to bots containers (rig/backpack/pockets/secure)
        botLootGenerator.GenerateLoot(botId, sessionId, botJsonTemplate,
            botGenerationDetails, botInventory);

        // Inventory cache isn't needed, clear to save memory
        if (botGenerationDetails.ClearBotContainerCacheAfterGeneration)
        {
            botInventoryContainerService.ClearCache(botId);
        }

        return botInventory;
    }

    void GenerateAndAddEquipmentToBotEx(
        MongoId botId,
        BotBaseInventory botInventory,
        BotGenerationDetails botGenerationDetails,
        bool isNightVision,
        bool isKittedHelmet
    )
    {
        var armbandTpl =
            botGenerationDetails.RoleLowercase == "pmcusec" ? PMCConfig.ForceArmband.Usec : PMCConfig.ForceArmband.Bear;
        gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.ArmBand,
            botGenerationDetails.Role,
            botInventory,
            armbandTpl);

        var generatedPockets = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Pockets,
            botGenerationDetails.Role,
            botInventory,
            botGenerationDetails is { GameVersion: GameEditions.UNHEARD, IsPmc: true }
                ? ItemTpl.POCKETS_1X4_TUE
                : ItemTpl.POCKETS_1X4);

        botInventoryContainerService.AddEmptyContainerToBot(botId, EquipmentSlots.Pockets, generatedPockets);

        var secureContainerItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.SecuredContainer,
            botGenerationDetails.Role,
            botInventory,
            ItemTpl.SECURE_CONTAINER_BOSS);

        botInventoryContainerService.AddEmptyContainerToBot(botId, EquipmentSlots.SecuredContainer, secureContainerItem);

        GenerateHeadwearAndEarpieceItem(
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory,
            isNightVision,
            isKittedHelmet);

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

        botInventoryContainerService.AddEmptyContainerToBot(botId, EquipmentSlots.Backpack, generatedBackPack);

        GenerateGearItem(
            botGenerationDetails.BotLevel,
            botGenerationDetails.Role,
            botInventory,
            EquipmentSlots.Scabbard);
    }

    void GenerateAndAddWeaponsToBotEx(
        MongoId botId,
        BotBaseInventory botInventory,
        BotType botJsonTemplate,
        BotGenerationDetails botGenerationDetails,
        bool isNightVision
        )
    {
        var botLevel = botGenerationDetails.BotLevel;
        var botRole = botGenerationDetails.Role;

        var generatedWeapon = weaponGenerator.GenerateWeapon(
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

        botWeaponGenerator.AddExtraMagazinesToInventory(
            botId,
            generatedWeaponResult,
            botJsonTemplate.BotGeneration.Items.Magazines,
            botInventory,
            botRole);
    }

    string GetGearItemTpl(
        int botLevel,
        EquipmentSlots equipmentSlot)
    {
        switch (equipmentSlot)
        {
            case EquipmentSlots.Earpiece:
                return gearGeneratorHelper.WeightedRandomGearItemTpl(
                    data.GetGear(botLevel).Headsets);

            case EquipmentSlots.Headwear:
                return gearGeneratorHelper.WeightedRandomGearItemTpl(
                    data.GetGear(botLevel).Helmets);

            case EquipmentSlots.Backpack:
                return gearGeneratorHelper.WeightedRandomGearItemTpl(
                    data.GetGear(botLevel).Backpacks);

            case EquipmentSlots.FaceCover:
                return gearGeneratorHelper.WeightedRandomGearItemTpl(
                    data.GetGear(botLevel).Face);

            case EquipmentSlots.Eyewear:
                return gearGeneratorHelper.WeightedRandomGearItemTpl(
                    data.GetGear(botLevel).Eyewear);

            case EquipmentSlots.Scabbard:
                return gearGeneratorHelper.WeightedRandomGearItemTpl(
                    data.GetGear(botLevel).Sheath);

            default:
                return "";
        }
    }

    void GenerateArmor(
        MongoId botId,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        if (randomUtil.GetBool())
        {
            var generatedArmoredRig = GenerateArmoredRig(botLevel, botRole, botInventory);
            botInventoryContainerService.AddEmptyContainerToBot(botId, EquipmentSlots.TacticalVest, generatedArmoredRig);
        }
        else
        {
            GenerateArmorVest(botLevel, botRole, botInventory);
            var generatedTacticalVest = GenerateTacticalVest(botLevel, botRole, botInventory);
            botInventoryContainerService.AddEmptyContainerToBot(botId, EquipmentSlots.TacticalVest, generatedTacticalVest);
        }
    }

    Item GenerateArmoredRig(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        var armoredRigTpl = gearGeneratorHelper.WeightedRandomGearItemTpl(
            data.GetGear(botLevel).ArmoredRigs);

        return gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.TacticalVest,
            botRole,
            botInventory,
            armoredRigTpl);
    }

    void GenerateArmorVest(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        var armoredRigTpl = gearGeneratorHelper.WeightedRandomGearItemTpl(
            data.GetGear(botLevel).Armor);

        gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.ArmorVest,
            botRole,
            botInventory,
            armoredRigTpl);
    }

    Item GenerateTacticalVest(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        var armoredRigTpl = gearGeneratorHelper.WeightedRandomGearItemTpl(
            data.GetGear(botLevel).Rigs);

        return gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.TacticalVest,
            botRole,
            botInventory,
            armoredRigTpl);
    }

    Item GenerateGearItem(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        EquipmentSlots equipmentSlot)
    {
        var gearItemTpl = GetGearItemTpl(botLevel, equipmentSlot);

        return gearGeneratorHelper.PutGearItemToInventory(
            equipmentSlot,
            botRole,
            botInventory,
            gearItemTpl);
    }

    void GenerateHeadwearAndEarpieceItem(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var headwearItemTpl = GetGearItemTpl(
            botLevel,
            EquipmentSlots.Headwear);

        helmetGenerator.GenerateHelmet(
            botLevel,
            botRole,
            botInventory,
            headwearItemTpl,
            isNightVision,
            isKittedHelmet);

        // for "SSh-68 steel helmet" only one earpiece "GSSh-01 active headset"
        if (headwearItemTpl == "5c06c6a80db834001b735491")
        {
            gearGeneratorHelper.PutGearItemToInventory(
                EquipmentSlots.Earpiece,
                botRole,
                botInventory,
                "5b432b965acfc47a8774094e");
            return;
        }

        if (helmetGenerator.IsEarpieceIncompatible(headwearItemTpl))
        {
            return;
        }

        var earpieceTpl = GetGearItemTpl(
            botLevel,
            EquipmentSlots.Earpiece);

        earpieceTpl = helmetGenerator.IsEarpieceNotFullyCompatible(
            headwearItemTpl)
            ? gearGeneratorHelper.ReplaceEarpiece(earpieceTpl)
            : earpieceTpl;

        gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Earpiece,
            botRole,
            botInventory,
            earpieceTpl);
    }
}
